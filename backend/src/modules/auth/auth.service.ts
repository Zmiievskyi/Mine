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
import { randomInt } from 'crypto';
import { timingSafeEqual } from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { GoogleProfile } from './strategies/google.strategy';
import { GitHubProfile } from './strategies/github.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

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
      emailVerified: false,
    });

    this.logger.log(`New user registered: ${user.id} (${user.email})`);

    // Generate and send verification code
    const verificationCode = randomInt(100000, 1000000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.usersService.setVerificationCode(user.id, verificationCode, expiresAt);

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationCode,
        user.name || undefined,
      );
      this.logger.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${user.email}:`, error);
      // Don't fail registration if email fails
    }

    const tokens = this.generateTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        emailVerified: false,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    // Constant-time comparison to prevent timing attacks
    // Always perform bcrypt.compare even if user doesn't exist
    const dummyHash =
      '$2b$10$dummyHashForTimingAttackPreventionXYZ123456789';
    const passwordToCompare = user?.password || dummyHash;

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      passwordToCompare,
    );

    // Generic error for all auth failures to prevent enumeration
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

  async googleLogin(googleProfile: GoogleProfile) {
    if (!googleProfile.email) {
      this.logger.warn('Google login attempt without email');
      throw new UnauthorizedException('Email is required for Google sign-in');
    }

    // Check if user exists by Google ID
    let user = await this.usersService.findByGoogleId(googleProfile.googleId);

    if (user) {
      if (!user.isActive) {
        this.logger.warn(`Google login blocked for inactive user: ${user.id}`);
        throw new UnauthorizedException('Account is disabled');
      }
      this.logger.log(`Google login for existing user: ${user.id} (${user.email})`);
      return this.createAuthResponse(user);
    }

    // Check if user exists by email (auto-link scenario)
    user = await this.usersService.findByEmail(googleProfile.email);

    if (user) {
      if (!user.isActive) {
        this.logger.warn(`Google login blocked for inactive user: ${user.id}`);
        throw new UnauthorizedException('Account is disabled');
      }
      // Link Google account to existing user
      await this.usersService.linkGoogleAccount(
        user.id,
        googleProfile.googleId,
        googleProfile.avatarUrl,
      );
      const updatedUser = await this.usersService.findById(user.id);
      if (!updatedUser) {
        throw new UnauthorizedException('Failed to update user');
      }
      this.logger.log(`Google account linked to user: ${updatedUser.id} (${updatedUser.email})`);
      return this.createAuthResponse(updatedUser);
    }

    // Create new user from Google profile
    user = await this.usersService.createFromGoogle({
      email: googleProfile.email,
      name: googleProfile.name,
      googleId: googleProfile.googleId,
      avatarUrl: googleProfile.avatarUrl,
    });

    this.logger.log(`New user created via Google: ${user.id} (${user.email})`);
    return this.createAuthResponse(user);
  }

  async githubLogin(githubProfile: GitHubProfile) {
    if (!githubProfile.email) {
      this.logger.warn('GitHub login attempt without email');
      throw new UnauthorizedException('Email is required for GitHub sign-in. Please make your email public on GitHub or use another login method.');
    }

    // Check if user exists by GitHub ID
    let user = await this.usersService.findByGithubId(githubProfile.githubId);

    if (user) {
      if (!user.isActive) {
        this.logger.warn(`GitHub login blocked for inactive user: ${user.id}`);
        throw new UnauthorizedException('Account is disabled');
      }
      this.logger.log(`GitHub login for existing user: ${user.id} (${user.email})`);
      return this.createAuthResponse(user);
    }

    // Check if user exists by email (auto-link scenario)
    user = await this.usersService.findByEmail(githubProfile.email);

    if (user) {
      if (!user.isActive) {
        this.logger.warn(`GitHub login blocked for inactive user: ${user.id}`);
        throw new UnauthorizedException('Account is disabled');
      }
      // Link GitHub account to existing user
      await this.usersService.linkGithubAccount(
        user.id,
        githubProfile.githubId,
        githubProfile.avatarUrl,
      );
      const updatedUser = await this.usersService.findById(user.id);
      if (!updatedUser) {
        throw new UnauthorizedException('Failed to update user');
      }
      this.logger.log(`GitHub account linked to user: ${updatedUser.id} (${updatedUser.email})`);
      return this.createAuthResponse(updatedUser);
    }

    // Create new user from GitHub profile
    user = await this.usersService.createFromGithub({
      email: githubProfile.email,
      name: githubProfile.name,
      githubId: githubProfile.githubId,
      avatarUrl: githubProfile.avatarUrl,
    });

    this.logger.log(`New user created via GitHub: ${user.id} (${user.email})`);
    return this.createAuthResponse(user);
  }

  private createAuthResponse(user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    avatarUrl?: string | null;
    provider?: string;
    emailVerified?: boolean;
  }) {
    const tokens = this.generateTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        emailVerified: user.emailVerified ?? true,
      },
      ...tokens,
    };
  }

  private generateTokens(user: { id: string; email: string; role: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async verifyEmail(userId: string, code: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Already verified - return success
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
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await this.usersService.lockVerification(userId, lockUntil);
      this.logger.warn(`User ${userId} locked after ${currentAttempts} failed attempts`);
      throw new ForbiddenException('Too many failed attempts. Account locked for 30 minutes');
    }

    // Constant-time comparison to prevent timing attacks
    const codeBuffer = Buffer.from(code.toLowerCase());
    const storedCodeBuffer = Buffer.from(user.verificationCode.toLowerCase());

    // Ensure buffers are same length for timingSafeEqual
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

    return {
      message: 'Email verified successfully',
      verified: true,
    };
  }

  async resendVerification(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.emailVerified) {
      throw new ConflictException('Email already verified');
    }

    // Generate new verification code
    const verificationCode = randomInt(100000, 1000000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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
}
