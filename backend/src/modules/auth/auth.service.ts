import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  GoneException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt, timingSafeEqual } from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { AuthTokenService } from './auth-token.service';
import { AuthOAuthService } from './auth-oauth.service';
import { LoginDto, RegisterDto, TelegramAuthData } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { GoogleProfile } from './strategies/google.strategy';
import { GitHubProfile } from './strategies/github.strategy';

/**
 * Main authentication service.
 * Handles core auth (register, login, validateUser) and email verification.
 * Delegates to AuthTokenService for token management and AuthOAuthService for OAuth.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private authTokenService: AuthTokenService,
    private authOAuthService: AuthOAuthService,
  ) {}

  // ============================================
  // Core Authentication
  // ============================================

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${registerDto.email}`);
      throw new ConflictException('Email already registered');
    }

    const bcryptRounds = this.configService.get<number>('app.bcryptRounds') ?? 12;
    const hashedPassword = await bcrypt.hash(registerDto.password, bcryptRounds);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      emailVerified: true, // Auto-verify (email verification disabled)
    });

    this.logger.log(`New user registered: ${user.id} (${user.email})`);

    const tokens = this.generateTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        emailVerified: true,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    // Constant-time comparison to prevent timing attacks
    const dummyHash = '$2b$10$dummyHashForTimingAttackPreventionXYZ123456789';
    const passwordToCompare = user?.password || dummyHash;

    const isPasswordValid = await bcrypt.compare(loginDto.password, passwordToCompare);

    if (!user || !user.password || !isPasswordValid || !user.isActive) {
      const reason = !user
        ? 'user_not_found'
        : !user.password
          ? 'no_password'
          : !isPasswordValid
            ? 'invalid_password'
            : 'inactive_account';
      this.logger.warn(`Failed login attempt for email: ${loginDto.email} (${reason})`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Successful login for user: ${user.id} (${user.email})`);

    const tokens = this.generateTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      emailVerified: user.emailVerified,
    };
  }

  // ============================================
  // Token Management (delegated)
  // ============================================

  generateTokenPair(
    user: { id: string; email: string | null; role: string },
    rememberMe: boolean,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    return this.authTokenService.generateTokenPair(user, rememberMe, deviceInfo, ipAddress);
  }

  refreshAccessToken(refreshToken: string, deviceInfo?: string, ipAddress?: string) {
    return this.authTokenService.refreshAccessToken(refreshToken, deviceInfo, ipAddress);
  }

  revokeRefreshToken(refreshToken: string) {
    return this.authTokenService.revokeRefreshToken(refreshToken);
  }

  revokeAllUserSessions(userId: string) {
    return this.authTokenService.revokeAllUserSessions(userId);
  }

  getActiveSessionsCount(userId: string) {
    return this.authTokenService.getActiveSessionsCount(userId);
  }

  cleanupExpiredTokens() {
    return this.authTokenService.cleanupExpiredTokens();
  }

  // ============================================
  // OAuth (delegated)
  // ============================================

  googleLogin(googleProfile: GoogleProfile) {
    return this.authOAuthService.googleLogin(googleProfile);
  }

  githubLogin(githubProfile: GitHubProfile) {
    return this.authOAuthService.githubLogin(githubProfile);
  }

  telegramLogin(telegramData: TelegramAuthData) {
    return this.authOAuthService.telegramLogin(telegramData);
  }

  // ============================================
  // Email Verification
  // ============================================

  async verifyEmail(userId: string, code: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.emailVerified) {
      this.logger.log(`User ${userId} already verified`);
      return { message: 'Email already verified', verified: true };
    }

    // Check if verification is locked
    if (user.verificationLockedUntil && user.verificationLockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.verificationLockedUntil.getTime() - Date.now()) / 60000,
      );
      this.logger.warn(`Verification locked for user ${userId}`);
      throw new ForbiddenException(
        `Too many failed attempts. Please try again in ${minutesLeft} minute(s)`,
      );
    }

    // Check if code exists and not expired
    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      this.logger.warn(`No verification code for user ${userId}`);
      throw new GoneException('Verification code expired or not found. Please request a new one');
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      this.logger.warn(`Expired verification code for user ${userId}`);
      throw new GoneException('Verification code expired. Please request a new one');
    }

    // Increment attempts before validation
    await this.usersService.incrementVerificationAttempts(userId);
    const currentAttempts = user.verificationAttempts + 1;

    // Lock after 5 failed attempts
    if (currentAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      await this.usersService.lockVerification(userId, lockUntil);
      this.logger.warn(`User ${userId} locked after ${currentAttempts} failed attempts`);
      throw new ForbiddenException('Too many failed attempts. Account locked for 30 minutes');
    }

    // Constant-time comparison to prevent timing attacks
    const codeBuffer = Buffer.from(code.toLowerCase());
    const storedCodeBuffer = Buffer.from(user.verificationCode.toLowerCase());

    if (codeBuffer.length !== storedCodeBuffer.length) {
      this.logger.warn(`Invalid code length for user ${userId}`);
      throw new UnprocessableEntityException('Invalid verification code');
    }

    const isValid = timingSafeEqual(codeBuffer, storedCodeBuffer);

    if (!isValid) {
      this.logger.warn(`Invalid verification code for user ${userId} (attempt ${currentAttempts}/5)`);
      throw new UnprocessableEntityException('Invalid verification code');
    }

    // Success - mark as verified
    await this.usersService.setEmailVerified(userId, true);
    await this.usersService.clearVerificationCode(userId);
    await this.usersService.resetVerificationAttempts(userId);

    this.logger.log(`Email verified successfully for user ${userId}`);

    return { message: 'Email verified successfully', verified: true };
  }

  async resendVerification(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.email) {
      throw new ConflictException('Email verification not available for this account');
    }

    if (user.emailVerified) {
      throw new ConflictException('Email already verified');
    }

    // Generate new verification code
    const verificationCode = randomInt(100000, 1000000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Reset attempts and clear lockout
    await this.usersService.resetVerificationAttempts(userId);
    await this.usersService.setVerificationCode(userId, verificationCode, expiresAt);

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationCode,
        user.name || undefined,
      );
      this.logger.log(`Verification code resent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to resend verification email to ${user.email}:`, error);
      throw new Error('Failed to send verification email. Please try again later');
    }

    return {
      message: 'Verification code sent',
      expiresAt: expiresAt.toISOString(),
    };
  }

  // ============================================
  // Private Helpers
  // ============================================

  private generateTokens(user: { id: string; email: string | null; role: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || '',
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
