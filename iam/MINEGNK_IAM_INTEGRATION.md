# MineGNK - Gcore IAM Integration Guide

This document summarizes research from Gcore Confluence for integrating MineGNK with Gcore IAM.

**Research Date:** December 2024
**Last Updated:** December 2024
**Source:** Gcore Internal Confluence (wiki.gcore.lu)

---

## Table of Contents

1. [Overview](#overview)
2. [Registration & User Creation](#registration--user-creation)
3. [Authentication Endpoints](#authentication-endpoints)
4. [OAuth/Social Login](#oauthsocial-login)
5. [SSO/SAML Integration](#ssosaml-integration)
6. [Reseller Model](#reseller-model)
7. [Integration Options for MineGNK](#integration-options-for-minegnk)
8. [RECOMMENDED: Full Gcore IAM with Reseller API](#recommended-full-gcore-iam-with-reseller-api)
9. [API Reference](#api-reference)
10. [Preprod Testing](#preprod-testing)

---

## Overview

### Gcore IAM Architecture

Gcore IAM (GCDNAPI) is a monolith that implements:
- **Registration** - User sign-up flow
- **Authentication** - JWT tokens, OAuth, SAML SSO
- **User Authorization** - Role-based access control
- **Customer & Service Management** - Accounts, products, features

### API Endpoints

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.gcore.com/iam/` |
| Preprod | `https://api.preprod.world/iam/` |

### Authentication Portal

| Environment | URL |
|-------------|-----|
| Production | `https://auth.gcore.com/` |
| Preprod | `https://auth.preprod.world/` |

---

## Registration & User Creation

### Public Registration Flow

```
User → https://auth.gcore.com/login/signup
     → Enter email + password
     → Account created (status: "preparation" or "new")
     → Email confirmation sent
     → User confirms email
     → Account status → "ready"
     → Access to Customer Portal
```

### Registration Statuses

| Status | Description |
|--------|-------------|
| `new` | Account just created |
| `preparation` | Registration in progress (choosing services, billing info) |
| `ready` | Account fully activated |

### User Creation API Endpoints

There are **two paths** to create users with Gcore IAM:

#### Path A: Redirect Flow (No Special Permissions)

Users are redirected to Gcore's auth portal for registration:

```
User clicks "Register" on MineGNK
         ↓
Redirect to https://auth.gcore.com/login/signup
         ↓
User creates account on Gcore portal (email + password)
         ↓
Gcore redirects back to MineGNK with token
         ↓
MineGNK validates token via /auth/verify
         ↓
MineGNK creates local user record with gcore_user_id
```

**Limitation:** User leaves your site for registration.

#### Path B: Direct API (Requires Reseller Status) ⭐ RECOMMENDED

With reseller status, MineGNK can create users directly via API:

```http
POST /iam/clients/{clientId}/client-users/create
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!",
  "user_role": {
    "id": 1,
    "name": "Administrators"
  },
  "lang": "en",
  "username": "string"
}
```

**Field Details:**

| Field | Required | Description |
|-------|----------|-------------|
| `email` | Yes | User's email address |
| `password` | Yes | Must meet Gcore password policy |
| `user_role.id` | Yes | Role ID (1 = Administrators) |
| `user_role.name` | Yes | Role name |
| `lang` | No | Language code (en, ru, cn, etc.) |
| `username` | No | Optional username |

**Response Codes:**

| Code | Description |
|------|-------------|
| `201 Created` | User successfully created |
| `400 Bad Request` | Validation error or user exists |
| `409 Conflict` | User with this email already exists |

**Prerequisites for Reseller API:**
1. MineGNK must be registered as a Gcore reseller
2. `CreateActiveUsersIsAllowed` permission must be enabled by Gcore team
3. Valid reseller `clientId` must be used in the endpoint

**Benefit:** Users never leave MineGNK site. You keep your own registration form.

#### Alternative: POST /iam/users (Admin Only)

```http
POST /iam/users
```

Creates a new user and associated client account. This is primarily for internal/admin use.

#### 3. Invite User to Account

```http
POST /iam/clients/invite_user
```

Sends invitation email to new or existing user to join an account.

### Email Confirmation

```http
POST /iam/auth/renew_invitation
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

Resends activation/confirmation email to user.

### Password Requirements

Standard Gcore password policy applies:
- Minimum length requirements
- Character complexity (uppercase, lowercase, numbers, special chars)
- Not in common password lists

### Blocked Countries

Registration is blocked for users from:
- Russia (.ru)
- Belarus (.by)
- North Korea (.kp)
- Cuba (.cu)
- Iran (.ir)
- Syria (.sy)

---

## Authentication Endpoints

### JWT Login

```http
POST /iam/auth/jwt/login
```

**Request:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "<access_token>",
  "refresh": "<refresh_token>"
}
```

### Token Refresh

```http
POST /iam/auth/jwt/refresh
```

**Request:**
```json
{
  "refresh": "<refresh_token>"
}
```

### Token Lifetimes

| Token Type | Lifetime |
|------------|----------|
| Access Token | 1 hour |
| Refresh Token | 24 hours |
| Permanent API Token | User-defined (can be unlimited) |

### Get Current Account

```http
GET /iam/clients/me
```

Returns current account information and details.

### Switch Between Accounts (Multi-client)

```http
GET /iam/auth/jwt/clients/{clientId}/login
```

For users with access to multiple accounts.

---

## OAuth/Social Login

Gcore supports OAuth 2.0 login with Google and GitHub.

### OAuth Flow

1. Frontend redirects to OAuth initiation endpoint
2. User authenticates with social provider
3. Provider redirects back with authorization code
4. Backend exchanges code for user data
5. User is created/authenticated in Gcore

### OAuth Endpoints

| Action | Endpoint |
|--------|----------|
| Google Login | `GET /auth/oauth2/login/google-oauth2` |
| GitHub Login | `GET /auth/oauth2/login/github` |
| OAuth Complete | `POST /auth/oauth2/complete/{backend}` |
| Get Result | `GET /auth/oauth2/result?session_id={id}` |

### OAuth Result Response

```json
{
  "access": "<access_token>",
  "refresh": "<refresh_token>",
  "is_first_enter": "true"
}
```

### Social User Creation

When user signs up via OAuth:
- `username` = `"{provider}/{provider_user_id}"` (e.g., `"github/1234"`)
- `social_network_auth` = `true`
- Profile changes disabled (email, password)

### Supported Providers

| Provider | Protocol | Supported |
|----------|----------|-----------|
| Google | OAuth 2.0 / OpenID | Yes |
| GitHub | OAuth 2.0 | Yes |
| Facebook | OAuth 2.0 | Mentioned but not primary |
| Slack | OAuth 2.0 | Mentioned but not primary |

---

## SSO/SAML Integration

### Supported Identity Providers

- Azure Active Directory
- Microsoft Active Directory
- Okta
- OneLogin
- PingFederate 7
- Any SAML 2.0 compatible IdP

### SAML SSO Flow

```
User → Service Provider (Gcore)
     → Redirect to IdP with SAML Request
     → User authenticates at IdP
     → IdP returns SAML Assertion
     → Gcore validates assertion
     → JWT token issued
     → User authenticated
```

### SAML Requirements

**From Identity Provider:**
- SAML 2.0 support
- SSO URL
- Entity ID
- Signing Certificate (X.509)

**Gcore SP Metadata:**
- Protocol: SAML 2.0
- Bindings: HTTP Redirect (SP→IdP), HTTP Post (IdP→SP)

### SSO Configuration Options

| Option | Description |
|--------|-------------|
| Username/Password login | Standard email/password |
| SSO login | SAML-based authentication |
| Both enabled | User can choose method |
| Only SSO | Password login disabled |
| Force redirect to IdP | Auto-redirect without choice |

---

## Reseller Model

### Self-Registration for Reseller Customers

Resellers can enable self-registration at their branded domain.

**Requirements:**
1. Base domain configured in branding settings
2. "Block creation of new accounts" = OFF
3. "Username/Password login" = enabled

**Self-Registration URL:**
```
https://auth.{base-domain}/login/signup
```

### Reseller Customer Account Defaults

When self-registering under a reseller:
- `signup_process`: "simplified"
- `reseller`: Reseller ID
- `capabilities`: Products enabled in reseller settings
- `reseller_service_management_method`: "PLATFORM"

### Enabling Self-Registration (Admin)

1. Go to Admin Portal → Resellers → Edit reseller
2. Enable "Open self-registration of accounts (using login/password)"
3. Ensure prerequisites are met

---

## Integration Options for MineGNK

### Option 1: "Login with Gcore" Button (OAuth-style)

**Flow:**
```
MineGNK → Redirect to auth.gcore.com/login/signin
       → User logs in (or signs up at Gcore)
       → Redirect back to MineGNK with token
       → MineGNK validates token via /auth/verify
       → Create local user linked to Gcore user_id
```

**Pros:**
- Simple implementation
- Gcore handles all user management
- Users can use existing Gcore accounts

**Cons:**
- Users leave your site for registration
- Dependency on Gcore for user data

### Option 2: Reseller White-Label

**If MineGNK is a Gcore reseller product:**
- Get reseller account from Gcore
- Configure base domain (e.g., `auth.minegnk.com`)
- Enable self-registration
- Users sign up at your branded domain
- Gcore handles everything (accounts, email verification, etc.)

**Pros:**
- Branded experience
- Full Gcore integration
- No custom auth code needed

**Cons:**
- Requires reseller agreement with Gcore
- Users need Gcore accounts

### Option 3: Hybrid Authentication

**Keep current auth + add Gcore SSO:**
- Existing users: email/password, Google, GitHub, Telegram
- Add "Login with Gcore" for Gcore customers
- Link accounts via `gcore_user_id` field in your DB

**Database Change:**
```sql
ALTER TABLE users ADD COLUMN gcore_user_id INTEGER NULL;
ALTER TABLE users ADD COLUMN gcore_client_id INTEGER NULL;
```

**Pros:**
- Best of both worlds
- No disruption to existing users
- Gcore customers get SSO convenience

**Cons:**
- Two auth systems to maintain
- Account linking complexity

### Option 4: Full Gcore IAM Migration

**Replace all auth with Gcore IAM:**
- Remove local password storage
- All auth goes through Gcore
- Users must have Gcore accounts

**Pros:**
- Single source of truth
- Enterprise-grade security
- SSO with Gcore dashboard

**Cons:**
- All users need Gcore accounts
- Loss of Telegram auth
- Significant migration effort

---

## RECOMMENDED: Full Gcore IAM with Reseller API

Since MineGNK can obtain Gcore reseller status, **this is the recommended approach**.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MineGNK Frontend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Login Form  │  │Register Form│  │    Dashboard/App        │ │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘ │
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MineGNK Backend                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   GcoreAuthService                       │   │
│  │  • Register user via /iam/clients/{id}/client-users/create│   │
│  │  • Login via /iam/auth/jwt/login                         │   │
│  │  • Validate tokens via /auth/verify                      │   │
│  │  • Refresh tokens via /iam/auth/jwt/refresh              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Gcore IAM API                              │
│         https://api.gcore.com/iam/                              │
│  • User management    • JWT tokens    • Password policies       │
│  • Email verification • OAuth         • Rate limiting           │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Flow

#### 1. User Registration

```
User fills registration form on MineGNK
         │
         ▼
┌─────────────────────────────────────┐
│ MineGNK Backend                     │
│ POST /iam/clients/{clientId}/       │
│      client-users/create            │
│ {                                   │
│   "email": "user@example.com",      │
│   "password": "SecureP@ss123!",     │
│   "user_role": {"id": 1, "name":    │
│                 "Administrators"},  │
│   "lang": "en"                      │
│ }                                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ Gcore IAM Response (201 Created)    │
│ {                                   │
│   "id": 12345,                      │
│   "email": "user@example.com",      │
│   "client_id": 67890               │
│ }                                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ MineGNK stores gcore_user_id        │
│ in local users table                │
└─────────────────────────────────────┘
```

#### 2. User Login

```
User enters email/password on MineGNK
         │
         ▼
┌─────────────────────────────────────┐
│ MineGNK Backend                     │
│ POST /iam/auth/jwt/login            │
│ {                                   │
│   "username": "user@example.com",   │
│   "password": "SecureP@ss123!"      │
│ }                                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ Gcore IAM Response (200 OK)         │
│ {                                   │
│   "access": "<jwt_access_token>",   │
│   "refresh": "<jwt_refresh_token>"  │
│ }                                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ MineGNK returns tokens to frontend  │
│ • Access token: in-memory (signal)  │
│ • Refresh token: HttpOnly cookie    │
└─────────────────────────────────────┘
```

#### 3. Token Validation (Protected Routes)

```
Request with Authorization header
         │
         ▼
┌─────────────────────────────────────┐
│ MineGNK Backend                     │
│ GET /auth/verify                    │
│ ?header_types=jwt                   │
│ &response_format=json_body          │
│ Authorization: Bearer <token>       │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ Gcore IAM Response (200 OK)         │
│ {                                   │
│   "user_id": 12345,                 │
│   "client_id": 67890,               │
│   "email": "user@example.com",      │
│   "exp": 1702345678,                │
│   "is_admin": false                 │
│ }                                   │
└─────────────────────────────────────┘
```

### Database Schema Changes

```sql
-- Simplified users table (passwords managed by Gcore)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gcore IAM identifiers
  gcore_user_id INTEGER NOT NULL UNIQUE,
  gcore_client_id INTEGER NOT NULL,

  -- Cached user info (synced from Gcore)
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),

  -- MineGNK-specific fields
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Node assignments remain the same
CREATE TABLE user_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  node_identifier VARCHAR(255) NOT NULL,
  gpu_type VARCHAR(50),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Backend Implementation Outline

```typescript
// gcore-auth.service.ts
@Injectable()
export class GcoreAuthService {
  private readonly iamBaseUrl = 'https://api.gcore.com/iam';
  private readonly clientId: string; // MineGNK reseller client ID

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.clientId = this.configService.get('GCORE_CLIENT_ID');
  }

  /**
   * Register new user via Gcore IAM
   */
  async register(dto: RegisterDto): Promise<GcoreUser> {
    const response = await this.httpService.post(
      `${this.iamBaseUrl}/clients/${this.clientId}/client-users/create`,
      {
        email: dto.email,
        password: dto.password,
        user_role: { id: 1, name: 'Administrators' },
        lang: 'en',
      },
      { headers: this.getAdminHeaders() }
    ).toPromise();

    return response.data;
  }

  /**
   * Login via Gcore IAM
   */
  async login(dto: LoginDto): Promise<GcoreTokens> {
    const response = await this.httpService.post(
      `${this.iamBaseUrl}/auth/jwt/login`,
      {
        username: dto.email,
        password: dto.password,
      }
    ).toPromise();

    return {
      accessToken: response.data.access,
      refreshToken: response.data.refresh,
    };
  }

  /**
   * Validate token via Gcore IAM
   */
  async validateToken(token: string): Promise<GcoreUserInfo> {
    const response = await this.httpService.get(
      `${this.iamBaseUrl.replace('/iam', '')}/auth/verify`,
      {
        params: {
          header_types: 'jwt',
          response_format: 'json_body',
        },
        headers: { Authorization: `Bearer ${token}` },
      }
    ).toPromise();

    return response.data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<string> {
    const response = await this.httpService.post(
      `${this.iamBaseUrl}/auth/jwt/refresh`,
      { refresh: refreshToken }
    ).toPromise();

    return response.data.access;
  }
}
```

### Environment Variables

```bash
# Gcore IAM Configuration
GCORE_IAM_BASE_URL=https://api.gcore.com/iam
GCORE_AUTH_BASE_URL=https://api.gcore.com/auth
GCORE_CLIENT_ID=<your_reseller_client_id>
GCORE_ADMIN_TOKEN=<admin_api_token_for_user_creation>

# For preprod testing
# GCORE_IAM_BASE_URL=https://api.preprod.world/iam
# GCORE_AUTH_BASE_URL=https://api.preprod.world/auth
```

### What Gets Removed from Current Codebase

| Component | File | Action |
|-----------|------|--------|
| Password hashing | `auth.service.ts` | Remove bcrypt |
| JWT generation | `auth.service.ts` | Remove (use Gcore tokens) |
| Refresh token storage | `auth-token.service.ts` | Remove |
| Google OAuth strategy | `google.strategy.ts` | Remove (Gcore handles) |
| GitHub OAuth strategy | `github.strategy.ts` | Remove (Gcore handles) |
| Telegram OAuth | `auth-oauth.service.ts` | Remove |
| Email verification | `auth.service.ts` | Remove (Gcore handles) |
| Password fields | `user.entity.ts` | Remove columns |

### What Gets Added

| Component | Description |
|-----------|-------------|
| `GcoreAuthService` | Handles all Gcore IAM API calls |
| `GcoreAuthGuard` | Validates Gcore JWT tokens |
| `gcore_user_id` column | Links local user to Gcore user |
| `gcore_client_id` column | Links to Gcore client account |

### Migration Steps

1. **Get Reseller Status**
   - Contact Gcore to register MineGNK as reseller
   - Request `CreateActiveUsersIsAllowed` permission
   - Obtain reseller `clientId`

2. **Update Database**
   - Add `gcore_user_id`, `gcore_client_id` columns
   - Remove password-related columns
   - Remove email verification columns

3. **Implement GcoreAuthService**
   - User registration via reseller API
   - Login via JWT endpoint
   - Token validation via /auth/verify
   - Token refresh

4. **Update Frontend**
   - Keep existing login/register forms (UI unchanged)
   - Update auth service to call new backend endpoints
   - Remove OAuth buttons (Google, GitHub, Telegram)
   - Or keep Google/GitHub if using Gcore's OAuth

5. **Testing on Preprod**
   - Use `https://api.preprod.world/iam/` for testing
   - Create test users
   - Verify full flow

---

## API Reference

### Full IAM Registry (Key Endpoints)

#### Authentication

| Event | Method | Path | Description |
|-------|--------|------|-------------|
| `iam.auth.login` | POST | `/iam/auth/jwt/login` | User authentication via JWT |
| `iam.auth.token.refresh` | POST | `/iam/auth/jwt/refresh` | Refresh JWT access token |
| `iam.auth.password.recover` | POST | `/iam/auth/password/forgot` | Initiate password recovery |
| `iam.auth.password.reset` | POST | `/iam/auth/reset_password` | Reset user password |
| `iam.auth.invitation.resend` | POST | `/iam/auth/renew_invitation` | Resend activation email |

#### User Management

| Event | Method | Path | Description |
|-------|--------|------|-------------|
| `iam.user.list` | GET | `/iam/users` | List users with pagination |
| `iam.user.create` | POST | `/iam/users` | Create new user with client account |
| `iam.user.details.get` | GET | `/iam/users/{userId}` | Get user details |
| `iam.user.details.update` | PATCH | `/iam/users/{userId}` | Update user profile |
| `iam.user.delete` | DELETE | `/iam/users/{userId}` | Delete user |
| `iam.user.email.update` | PUT | `/iam/users/{userId}/email` | Update user email |
| `iam.client.user.invite` | POST | `/iam/clients/invite_user` | Invite user to account |
| `iam.client.user.create` | POST | `/iam/clients/{clientId}/client-users/create` | Create user in account |

#### Account Management

| Event | Method | Path | Description |
|-------|--------|------|-------------|
| `iam.account.create` | POST | `/iam/clients/create` | Create additional account |
| `iam.account.details.get` | GET | `/iam/clients/me` | Get current account info |

#### API Tokens

| Event | Method | Path | Description |
|-------|--------|------|-------------|
| `iam.client.token.list` | GET | `/iam/clients/{clientId}/tokens` | List API tokens |
| `iam.client.token.create` | POST | `/iam/clients/{clientId}/tokens` | Create API token |
| `iam.client.token.delete` | DELETE | `/iam/clients/{clientId}/tokens/{tokenId}` | Delete token |

### Token Validation

```http
GET /auth/verify?header_types=apikey,jwt&response_format=json_body
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "exp": 1682345678,
  "user_id": 1234,
  "client_id": 5678,
  "email": "user@example.com",
  "username": "username",
  "is_admin": false,
  "user_type": "common",
  "user_groups": []
}
```

---

## Preprod Testing

### Create Test Account

1. Go to: `https://auth.preprod.world/login/signup`
2. Enter any non-existing email
3. Check MailHog for confirmation: `https://mailhog-preprod.i.gc.onl/`
4. Click confirmation link
5. Access Customer Portal on preprod

### Test Card Numbers (Adyen)

For testing payment flows:
- See: https://docs.adyen.com/development-resources/testing/test-card-numbers/

### Activate Products (Admin)

1. Login to: `https://admin.admin.preprod.world/`
2. Navigate to Accounts
3. Find your test account
4. Open Products page
5. Enable needed products

---

## Recommendation for MineGNK

### ⭐ RECOMMENDED: Full Gcore IAM with Reseller API

Since MineGNK can obtain Gcore reseller status, the recommended approach is **full Gcore IAM migration using the Reseller API**.

**Why this approach:**
- Users never leave MineGNK site (own registration form)
- Single source of truth for authentication
- Enterprise-grade security (Gcore handles passwords, rate limiting, etc.)
- No custom auth code to maintain
- Potential SSO with Gcore dashboard for power users

**Key Endpoints:**
| Action | Endpoint |
|--------|----------|
| Register | `POST /iam/clients/{clientId}/client-users/create` |
| Login | `POST /iam/auth/jwt/login` |
| Validate | `GET /auth/verify?header_types=jwt&response_format=json_body` |
| Refresh | `POST /iam/auth/jwt/refresh` |

**Prerequisites:**
1. Register MineGNK as Gcore reseller
2. Request `CreateActiveUsersIsAllowed` permission
3. Obtain reseller `clientId`

**Implementation Steps:**
1. Get reseller status from Gcore
2. Update database schema (add `gcore_user_id`, remove password fields)
3. Implement `GcoreAuthService` for IAM API calls
4. Update frontend auth service (keep existing UI)
5. Test on preprod environment
6. Deploy to production

See [RECOMMENDED: Full Gcore IAM with Reseller API](#recommended-full-gcore-iam-with-reseller-api) section for detailed implementation guide.

---

## Source References

- IAM Registry: `wiki.gcore.lu/pages/viewpage.action?pageId=234624838`
- Customer Portal: `wiki.gcore.lu/pages/viewpage.action?pageId=34210280`
- Authentication Service: `wiki.gcore.lu/pages/viewpage.action?pageId=85035873`
- Sign up with Social Networks: `wiki.gcore.lu/pages/viewpage.action?pageId=100207216`
- Public SAML SSO: `wiki.gcore.lu/pages/viewpage.action?pageId=114091720`
- Self-registration: `wiki.gcore.lu/pages/viewpage.action?pageId=170138085`
- Users Creation: `wiki.gcore.lu/pages/viewpage.action?pageId=185781133`
