import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { UsersService } from '../users/users.service';
import { TelegramAuthData } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { GoogleProfile } from './strategies/google.strategy';
import { GitHubProfile } from './strategies/github.strategy';

/**
 * Service responsible for OAuth authentication flows.
 * Handles Google, GitHub, and Telegram login.
 */
@Injectable()
export class AuthOAuthService {
  private readonly logger = new Logger(AuthOAuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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

  async telegramLogin(telegramData: TelegramAuthData) {
    // 1. Verify the hash from Telegram
    if (!this.verifyTelegramHash(telegramData)) {
      this.logger.warn('Telegram login with invalid hash');
      throw new UnauthorizedException('Invalid Telegram authentication');
    }

    // 2. Check auth_date is not too old (5 minutes max)
    const authAge = Date.now() / 1000 - telegramData.auth_date;
    if (authAge > 300) {
      this.logger.warn(`Telegram auth expired (age: ${authAge}s)`);
      throw new UnauthorizedException('Telegram authentication expired. Please try again.');
    }

    // 3. Check if user exists by Telegram ID
    let user = await this.usersService.findByTelegramId(telegramData.id);

    if (user) {
      if (!user.isActive) {
        this.logger.warn(`Telegram login blocked for inactive user: ${user.id}`);
        throw new UnauthorizedException('Account is disabled');
      }
      this.logger.log(`Telegram login for existing user: ${user.id}`);
      return this.createAuthResponse(user);
    }

    // 4. Create new user from Telegram profile
    const fullName = [telegramData.first_name, telegramData.last_name]
      .filter(Boolean)
      .join(' ');

    user = await this.usersService.createFromTelegram({
      telegramId: telegramData.id,
      name: fullName || undefined,
      telegramUsername: telegramData.username,
      avatarUrl: telegramData.photo_url,
    });

    this.logger.log(`New user created via Telegram: ${user.id} (@${telegramData.username || 'no-username'})`);
    return this.createAuthResponse(user);
  }

  private verifyTelegramHash(data: TelegramAuthData): boolean {
    const botToken = this.configService.get<string>('telegram.botToken');
    if (!botToken) {
      this.logger.error('Telegram bot token not configured');
      return false;
    }

    // Create secret key from bot token
    const secretKey = createHash('sha256').update(botToken).digest();

    // Build data-check-string (sorted alphabetically, excluding hash)
    const checkString = Object.keys(data)
      .filter((key) => key !== 'hash')
      .sort()
      .map((key) => `${key}=${data[key as keyof TelegramAuthData]}`)
      .join('\n');

    // Calculate HMAC-SHA256
    const hmac = createHmac('sha256', secretKey).update(checkString).digest('hex');

    // Timing-safe comparison
    try {
      return timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(data.hash, 'hex'));
    } catch {
      return false;
    }
  }

  createAuthResponse(user: {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    avatarUrl?: string | null;
    provider?: string;
    emailVerified?: boolean;
    telegramUsername?: string | null;
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
