# MineGNK - Gcore IAM Implementation Plan

**Status:** Ready for Implementation
**Created:** December 2024
**Prerequisites:** Gcore Reseller Status (pending)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Phase 1: Database Migration](#2-phase-1-database-migration)
3. [Phase 2: Backend Changes](#3-phase-2-backend-changes)
4. [Phase 3: Frontend Changes](#4-phase-3-frontend-changes)
5. [Phase 4: Testing](#5-phase-4-testing)
6. [Phase 5: Deployment](#6-phase-5-deployment)
7. [File Reference](#7-file-reference)
8. [Rollback Plan](#8-rollback-plan)

---

## 1. Prerequisites

### 1.1 Required from Gcore

| Item | Description | Status | Contact |
|------|-------------|--------|---------|
| Reseller Status | Register MineGNK as Gcore reseller | ⏳ Pending | Gcore Account Manager |
| `CreateActiveUsersIsAllowed` | Permission to create users via API | ⏳ Pending | Gcore IAM Team |
| Reseller `clientId` | Your reseller client ID | ⏳ Pending | After reseller approval |
| Admin API Token | Permanent token for user creation | ⏳ Pending | Create in Gcore portal |

### 1.2 Environment Variables to Add

```bash
# Add to backend/.env
GCORE_IAM_BASE_URL=https://api.gcore.com/iam
GCORE_AUTH_BASE_URL=https://api.gcore.com/auth
GCORE_RESELLER_CLIENT_ID=<your_reseller_client_id>
GCORE_ADMIN_TOKEN=<admin_api_token_for_user_creation>

# Preprod (for testing)
# GCORE_IAM_BASE_URL=https://api.preprod.world/iam
# GCORE_AUTH_BASE_URL=https://api.preprod.world/auth
```

### 1.3 Preprod Testing Setup

1. Create account: https://auth.preprod.world/login/signup
2. Check email at: https://mailhog-preprod.i.gc.onl/
3. Admin portal: https://admin.admin.preprod.world/

---

## 2. Phase 1: Database Migration

### 2.1 Create Migration File

**File:** `backend/src/migrations/XXXXXX-gcore-iam-migration.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class GcoreIamMigration1234567890 implements MigrationInterface {
  name = 'GcoreIamMigration1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new Gcore columns
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "gcore_user_id" INTEGER UNIQUE,
      ADD COLUMN IF NOT EXISTS "gcore_client_id" INTEGER
    `);

    // Step 2: Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_gcore_user_id"
      ON "users" ("gcore_user_id")
    `);

    // Note: We keep old columns during transition period
    // They will be removed in a separate migration after full migration
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_gcore_user_id"`);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "gcore_user_id",
      DROP COLUMN IF EXISTS "gcore_client_id"
    `);
  }
}
```

### 2.2 Update User Entity

**File:** `backend/src/modules/users/entities/user.entity.ts`

```typescript
// ADD these columns:
@Column({ type: 'integer', unique: true, nullable: true, name: 'gcore_user_id' })
gcoreUserId: number | null;

@Column({ type: 'integer', nullable: true, name: 'gcore_client_id' })
gcoreClientId: number | null;

// KEEP for transition (mark as deprecated):
/** @deprecated Will be removed after Gcore IAM migration */
@Column({ type: 'varchar', nullable: true })
@Exclude()
password: string | null;

/** @deprecated Use Gcore OAuth instead */
@Column({ type: 'varchar', nullable: true, unique: true })
googleId: string | null;

/** @deprecated Use Gcore OAuth instead */
@Column({ type: 'varchar', nullable: true, unique: true })
githubId: string | null;

/** @deprecated Telegram auth not supported in Gcore IAM */
@Column({ type: 'varchar', nullable: true, unique: true, name: 'telegram_id' })
telegramId: string | null;
```

### 2.3 Migration Checklist

- [ ] Create migration file
- [ ] Test migration on local DB
- [ ] Test rollback
- [ ] Update User entity
- [ ] Run migration on preprod

---

## 3. Phase 2: Backend Changes

### 3.1 Files to DELETE

| File | Reason |
|------|--------|
| `backend/src/modules/auth/strategies/google.strategy.ts` | Gcore handles OAuth |
| `backend/src/modules/auth/strategies/github.strategy.ts` | Gcore handles OAuth |
| `backend/src/modules/auth/auth-oauth.service.ts` | All OAuth via Gcore |
| `backend/src/modules/auth/dto/telegram-auth.dto.ts` | Not supported |
| `backend/src/modules/auth/dto/verify-email.dto.ts` | Gcore handles email verification |
| `backend/src/modules/auth/guards/email-verified.guard.ts` | Not needed |
| `backend/src/modules/auth/entities/refresh-token.entity.ts` | Use Gcore tokens |
| `backend/src/modules/auth/auth-token.service.ts` | Use Gcore token refresh |
| `backend/src/modules/auth/auth.scheduler.ts` | No local token cleanup needed |
| `backend/src/config/google.config.ts` | Not needed |
| `backend/src/config/github.config.ts` | Not needed |
| `backend/src/config/telegram.config.ts` | Not needed |

### 3.2 Files to CREATE

#### 3.2.1 Gcore Config

**File:** `backend/src/config/gcore-iam.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('gcoreIam', () => ({
  iamBaseUrl: process.env.GCORE_IAM_BASE_URL || 'https://api.gcore.com/iam',
  authBaseUrl: process.env.GCORE_AUTH_BASE_URL || 'https://api.gcore.com/auth',
  resellerClientId: process.env.GCORE_RESELLER_CLIENT_ID,
  adminToken: process.env.GCORE_ADMIN_TOKEN,
}));
```

#### 3.2.2 Gcore Auth Service

**File:** `backend/src/modules/auth/gcore-auth.service.ts`

```typescript
import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto';

interface GcoreTokens {
  access: string;
  refresh: string;
}

interface GcoreUserInfo {
  user_id: number;
  client_id: number;
  email: string;
  username: string;
  is_admin: boolean;
  exp: number;
}

interface GcoreCreatedUser {
  id: number;
  email: string;
  client_id: number;
}

@Injectable()
export class GcoreAuthService {
  private readonly logger = new Logger(GcoreAuthService.name);
  private readonly iamBaseUrl: string;
  private readonly authBaseUrl: string;
  private readonly resellerClientId: string;
  private readonly adminToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.iamBaseUrl = this.configService.get<string>('gcoreIam.iamBaseUrl')!;
    this.authBaseUrl = this.configService.get<string>('gcoreIam.authBaseUrl')!;
    this.resellerClientId = this.configService.get<string>('gcoreIam.resellerClientId')!;
    this.adminToken = this.configService.get<string>('gcoreIam.adminToken')!;
  }

  /**
   * Register new user via Gcore IAM Reseller API
   */
  async register(dto: RegisterDto) {
    // Check if user already exists locally
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    try {
      // Create user in Gcore IAM
      const response = await firstValueFrom(
        this.httpService.post<GcoreCreatedUser>(
          `${this.iamBaseUrl}/clients/${this.resellerClientId}/client-users/create`,
          {
            email: dto.email,
            password: dto.password,
            user_role: { id: 1, name: 'Administrators' },
            lang: 'en',
          },
          {
            headers: {
              Authorization: `Bearer ${this.adminToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const gcoreUser = response.data;
      this.logger.log(`Created Gcore user: ${gcoreUser.id} (${gcoreUser.email})`);

      // Create local user record linked to Gcore
      const user = await this.usersService.create({
        email: dto.email,
        name: dto.name,
        gcoreUserId: gcoreUser.id,
        gcoreClientId: gcoreUser.client_id,
        emailVerified: true, // Gcore handles verification
      });

      // Login to get tokens
      const tokens = await this.login({ email: dto.email, password: dto.password });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          gcoreUserId: user.gcoreUserId,
        },
        ...tokens,
      };
    } catch (error: any) {
      this.logger.error(`Gcore registration failed: ${error.message}`, error.response?.data);

      if (error.response?.status === 409) {
        throw new ConflictException('Email already registered in Gcore');
      }
      throw error;
    }
  }

  /**
   * Login via Gcore IAM JWT endpoint
   */
  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GcoreTokens>(
          `${this.iamBaseUrl}/auth/jwt/login`,
          {
            username: dto.email,
            password: dto.password,
          },
        ),
      );

      const { access, refresh } = response.data;

      // Validate token to get user info
      const userInfo = await this.validateToken(access);

      // Ensure local user exists
      let user = await this.usersService.findByGcoreUserId(userInfo.user_id);
      if (!user) {
        // First-time login - create local record
        user = await this.usersService.create({
          email: userInfo.email,
          gcoreUserId: userInfo.user_id,
          gcoreClientId: userInfo.client_id,
          emailVerified: true,
        });
        this.logger.log(`Created local user for Gcore user: ${userInfo.user_id}`);
      }

      this.logger.log(`Successful login for user: ${user.id} (Gcore: ${userInfo.user_id})`);

      return {
        accessToken: access,
        refreshToken: refresh,
      };
    } catch (error: any) {
      this.logger.warn(`Login failed: ${error.message}`);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  /**
   * Validate Gcore JWT token
   */
  async validateToken(token: string): Promise<GcoreUserInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<GcoreUserInfo>(
          `${this.authBaseUrl}/verify`,
          {
            params: {
              header_types: 'jwt',
              response_format: 'json_body',
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.logger.warn(`Token validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Refresh access token via Gcore IAM
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ access: string }>(
          `${this.iamBaseUrl}/auth/jwt/refresh`,
          { refresh: refreshToken },
        ),
      );

      return { accessToken: response.data.access };
    } catch (error: any) {
      this.logger.warn(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(token: string) {
    const gcoreInfo = await this.validateToken(token);
    const user = await this.usersService.findByGcoreUserId(gcoreInfo.user_id);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      gcoreUserId: user.gcoreUserId,
      gcoreClientId: user.gcoreClientId,
    };
  }
}
```

#### 3.2.3 Gcore JWT Guard

**File:** `backend/src/modules/auth/guards/gcore-jwt.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GcoreAuthService } from '../gcore-auth.service';

@Injectable()
export class GcoreJwtGuard implements CanActivate {
  constructor(private readonly gcoreAuthService: GcoreAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const gcoreInfo = await this.gcoreAuthService.validateToken(token);

      // Attach user info to request
      request.user = {
        gcoreUserId: gcoreInfo.user_id,
        gcoreClientId: gcoreInfo.client_id,
        email: gcoreInfo.email,
        isAdmin: gcoreInfo.is_admin,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

### 3.3 Files to MODIFY

#### 3.3.1 Auth Module

**File:** `backend/src/modules/auth/auth.module.ts`

```typescript
// REMOVE:
- import { GoogleStrategy } from './strategies/google.strategy';
- import { GitHubStrategy } from './strategies/github.strategy';
- import { AuthTokenService } from './auth-token.service';
- import { AuthOAuthService } from './auth-oauth.service';
- import { RefreshToken } from './entities/refresh-token.entity';

// ADD:
+ import { HttpModule } from '@nestjs/axios';
+ import { GcoreAuthService } from './gcore-auth.service';
+ import { GcoreJwtGuard } from './guards/gcore-jwt.guard';
+ import gcoreIamConfig from '../../config/gcore-iam.config';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forFeature(gcoreIamConfig),
    // ... other imports
  ],
  providers: [
    GcoreAuthService,
    GcoreJwtGuard,
    // REMOVE: GoogleStrategy, GitHubStrategy, AuthTokenService, AuthOAuthService
  ],
  exports: [GcoreAuthService, GcoreJwtGuard],
})
```

#### 3.3.2 Auth Controller

**File:** `backend/src/modules/auth/auth.controller.ts`

```typescript
// Simplified controller using GcoreAuthService

@Controller('auth')
export class AuthController {
  constructor(private readonly gcoreAuthService: GcoreAuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.gcoreAuthService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.gcoreAuthService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.gcoreAuthService.refreshToken(refreshToken);
  }

  @Get('me')
  @UseGuards(GcoreJwtGuard)
  async me(@Req() req: Request) {
    const token = req.headers.authorization?.substring(7);
    return this.gcoreAuthService.getCurrentUser(token!);
  }

  // REMOVE: Google, GitHub, Telegram OAuth endpoints
}
```

#### 3.3.3 Users Service

**File:** `backend/src/modules/users/users.service.ts`

```typescript
// ADD method:
async findByGcoreUserId(gcoreUserId: number): Promise<User | null> {
  return this.usersRepository.findOne({
    where: { gcoreUserId },
  });
}
```

### 3.4 Backend Checklist

- [ ] Create `gcore-iam.config.ts`
- [ ] Create `gcore-auth.service.ts`
- [ ] Create `gcore-jwt.guard.ts`
- [ ] Update `auth.module.ts`
- [ ] Update `auth.controller.ts`
- [ ] Update `users.service.ts` (add findByGcoreUserId)
- [ ] Update `user.entity.ts`
- [ ] Delete OAuth strategies
- [ ] Delete `auth-token.service.ts`
- [ ] Delete `auth-oauth.service.ts`
- [ ] Delete unused configs
- [ ] Update tests

---

## 4. Phase 3: Frontend Changes

### 4.1 Files to DELETE

| File | Reason |
|------|--------|
| `frontend/src/app/shared/components/oauth-buttons/google-oauth-button.component.ts` | Not needed |
| `frontend/src/app/shared/components/oauth-buttons/github-oauth-button.component.ts` | Not needed |
| `frontend/src/app/shared/components/oauth-buttons/telegram-oauth-button.component.ts` | Not needed |
| `frontend/src/app/features/auth/oauth-callback/` | Gcore handles OAuth |

### 4.2 Files to MODIFY

#### 4.2.1 Auth Service

**File:** `frontend/src/app/core/services/auth.service.ts`

```typescript
// Simplified - just forward to backend which talks to Gcore

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  // Keep existing signal-based token management
  private readonly accessToken = signal<string | null>(null);

  register(data: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', data).pipe(
      tap(response => this.accessToken.set(response.accessToken))
    );
  }

  login(data: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', data).pipe(
      tap(response => this.accessToken.set(response.accessToken))
    );
  }

  refresh(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>('/api/auth/refresh', {
      refreshToken: this.getRefreshToken()
    }).pipe(
      tap(response => this.accessToken.set(response.accessToken))
    );
  }

  // REMOVE: googleLogin(), githubLogin(), telegramLogin()
}
```

#### 4.2.2 Login Component

**File:** `frontend/src/app/features/auth/login/login.component.ts`

```typescript
// REMOVE OAuth button imports and usage
// Keep only email/password form
```

#### 4.2.3 Register Component

**File:** `frontend/src/app/features/auth/register/register.component.ts`

```typescript
// REMOVE OAuth button imports and usage
// Keep only email/password form
```

### 4.3 Frontend Checklist

- [ ] Update `auth.service.ts`
- [ ] Remove OAuth buttons from login page
- [ ] Remove OAuth buttons from register page
- [ ] Delete OAuth button components
- [ ] Delete oauth-callback route/component
- [ ] Update auth routes
- [ ] Test login/register flow

---

## 5. Phase 4: Testing

### 5.1 Preprod Testing Checklist

- [ ] Create test account on Gcore preprod
- [ ] Configure backend with preprod URLs
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test token refresh
- [ ] Test protected endpoints
- [ ] Test admin access

### 5.2 Test Scenarios

```bash
# 1. Register new user
curl -X POST https://your-preprod/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecureP@ss123!", "name": "Test User"}'

# 2. Login
curl -X POST https://your-preprod/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecureP@ss123!"}'

# 3. Access protected endpoint
curl https://your-preprod/api/nodes \
  -H "Authorization: Bearer <access_token>"

# 4. Refresh token
curl -X POST https://your-preprod/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refresh_token>"}'
```

### 5.3 Unit Tests

- [ ] `gcore-auth.service.spec.ts` - Mock HTTP calls to Gcore
- [ ] `gcore-jwt.guard.spec.ts` - Test token validation
- [ ] Update existing auth tests

---

## 6. Phase 5: Deployment

### 6.1 Pre-Deployment

- [ ] Backup database
- [ ] Run migration on staging
- [ ] Full regression test
- [ ] Update environment variables in production

### 6.2 Deployment Steps

1. Deploy database migration
2. Deploy backend with new auth service
3. Deploy frontend without OAuth buttons
4. Monitor logs for errors
5. Test production login/register

### 6.3 Post-Deployment

- [ ] Monitor error rates
- [ ] Check user registration success rate
- [ ] Verify token refresh working
- [ ] Test admin functionality

---

## 7. File Reference

### 7.1 Summary Table

| Action | Backend Files | Frontend Files |
|--------|--------------|----------------|
| **DELETE** | `strategies/google.strategy.ts` | `oauth-buttons/*` |
| | `strategies/github.strategy.ts` | `oauth-callback/*` |
| | `auth-oauth.service.ts` | |
| | `auth-token.service.ts` | |
| | `auth.scheduler.ts` | |
| | `entities/refresh-token.entity.ts` | |
| | `dto/telegram-auth.dto.ts` | |
| | `dto/verify-email.dto.ts` | |
| | `guards/email-verified.guard.ts` | |
| | `config/google.config.ts` | |
| | `config/github.config.ts` | |
| | `config/telegram.config.ts` | |
| **CREATE** | `config/gcore-iam.config.ts` | |
| | `gcore-auth.service.ts` | |
| | `guards/gcore-jwt.guard.ts` | |
| **MODIFY** | `auth.module.ts` | `auth.service.ts` |
| | `auth.controller.ts` | `login.component.ts` |
| | `user.entity.ts` | `register.component.ts` |
| | `users.service.ts` | `auth.routes.ts` |

### 7.2 Line Count Estimates

| File | Lines to Remove | Lines to Add |
|------|-----------------|--------------|
| Backend total | ~800 | ~400 |
| Frontend total | ~300 | ~50 |
| **Net change** | **-650 lines** | |

---

## 8. Rollback Plan

### 8.1 If Migration Fails

```bash
# Rollback database migration
npm run migration:revert

# Restore from backup
pg_restore -d minegnk backup.sql
```

### 8.2 If Gcore IAM Down

- Current local auth code is preserved during transition
- Can quickly restore by reverting git commits
- Keep `password` column in DB during transition period

### 8.3 Feature Flags (Optional)

```typescript
// config
const USE_GCORE_AUTH = process.env.USE_GCORE_AUTH === 'true';

// In auth.module.ts
providers: [
  USE_GCORE_AUTH ? GcoreAuthService : AuthService,
]
```

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Prerequisites | 1-2 weeks | Gcore approval |
| Phase 1: Database | 1 day | Prerequisites |
| Phase 2: Backend | 3-4 days | Phase 1 |
| Phase 3: Frontend | 1-2 days | Phase 2 |
| Phase 4: Testing | 2-3 days | Phase 3 |
| Phase 5: Deploy | 1 day | Phase 4 |
| **Total** | **2-3 weeks** | After Gcore approval |

---

## Next Steps

1. **Contact Gcore** to request reseller status
2. **Get preprod credentials** for testing
3. **Start Phase 1** once approved
