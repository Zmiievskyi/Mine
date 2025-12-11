import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThan, Not, In } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtPayload } from './strategies/jwt.strategy';

/**
 * Service responsible for JWT and refresh token management.
 * Handles token generation, refresh, revocation, and session management.
 */
@Injectable()
export class AuthTokenService {
  private readonly logger = new Logger(AuthTokenService.name);
  private readonly REFRESH_TOKEN_BYTES = 32; // 256 bits

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Generate access token (short-lived, 15 min default).
   */
  generateAccessToken(user: { id: string; email: string | null; role: string }): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || '',
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Generate both access token and refresh token.
   * Refresh token is stored hashed in database.
   */
  async generateTokenPair(
    user: { id: string; email: string | null; role: string },
    rememberMe: boolean,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const accessToken = this.generateAccessToken(user);

    // Generate refresh token (random bytes, URL-safe base64)
    const refreshTokenRaw = randomBytes(this.REFRESH_TOKEN_BYTES).toString('base64url');
    const tokenHash = createHash('sha256').update(refreshTokenRaw).digest('hex');

    // Calculate expiry based on rememberMe
    const expiresIn = rememberMe
      ? this.configService.get<string>('jwt.refreshTokenExpiresIn') || '7d'
      : this.configService.get<string>('jwt.refreshTokenShortExpiresIn') || '24h';
    const expiresAt = this.calculateExpiry(expiresIn);

    // Enforce session limit (max 5 by default)
    await this.enforceSessionLimit(user.id);

    // Store hashed token in database
    await this.refreshTokenRepository.save({
      userId: user.id,
      tokenHash,
      deviceInfo: deviceInfo?.substring(0, 255) || null,
      ipAddress: ipAddress?.substring(0, 45) || null,
      expiresAt,
    });

    this.logger.log(`Refresh token created for user ${user.id} (expires: ${expiresAt.toISOString()})`);

    return { accessToken, refreshToken: refreshTokenRaw, expiresAt };
  }

  /**
   * Refresh access token using a valid refresh token.
   * Implements token rotation: old refresh token is revoked, new one is issued.
   */
  async refreshAccessToken(
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    // Find valid token
    const storedToken = await this.refreshTokenRepository.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: Not(LessThan(new Date())),
      },
      relations: ['user'],
    });

    if (!storedToken) {
      this.logger.warn('Refresh token not found or expired');
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!storedToken.user || !storedToken.user.isActive) {
      this.logger.warn(`Refresh attempt for inactive user: ${storedToken.userId}`);
      await this.refreshTokenRepository.update(storedToken.id, { revokedAt: new Date() });
      throw new UnauthorizedException('Account is disabled');
    }

    // Token rotation: revoke old token
    await this.refreshTokenRepository.update(storedToken.id, {
      revokedAt: new Date(),
      lastUsedAt: new Date(),
    });

    // Determine if this was a long session (remember me)
    const remainingTime = storedToken.expiresAt.getTime() - Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const isLongSession = remainingTime > oneDayMs;

    // Generate new token pair
    const newTokenPair = await this.generateTokenPair(
      storedToken.user,
      isLongSession,
      deviceInfo,
      ipAddress,
    );

    this.logger.log(`Token refreshed for user ${storedToken.userId}`);

    return newTokenPair;
  }

  /**
   * Revoke a single refresh token (logout from one device).
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const result = await this.refreshTokenRepository.update(
      { tokenHash, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log('Refresh token revoked');
    }
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices).
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    const count = result.affected || 0;
    this.logger.log(`Revoked ${count} sessions for user ${userId}`);
    return count;
  }

  /**
   * Get active sessions count for a user.
   */
  async getActiveSessionsCount(userId: string): Promise<number> {
    return this.refreshTokenRepository.count({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: Not(LessThan(new Date())),
      },
    });
  }

  /**
   * Enforce maximum session limit per user.
   * Revokes oldest sessions when limit is exceeded.
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const maxSessions = this.configService.get<number>('jwt.maxSessions') || 5;

    const activeSessions = await this.refreshTokenRepository.find({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: Not(LessThan(new Date())),
      },
      order: { createdAt: 'ASC' },
    });

    if (activeSessions.length >= maxSessions) {
      const sessionsToRevoke = activeSessions.slice(0, activeSessions.length - maxSessions + 1);
      const idsToRevoke = sessionsToRevoke.map((s) => s.id);

      if (idsToRevoke.length > 0) {
        await this.refreshTokenRepository.update(
          { id: In(idsToRevoke) },
          { revokedAt: new Date() },
        );
        this.logger.log(`Revoked ${idsToRevoke.length} old sessions for user ${userId} (limit: ${maxSessions})`);
      }
    }
  }

  /**
   * Calculate expiry date from duration string (e.g., '7d', '24h', '15m').
   */
  private calculateExpiry(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiresIn}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  /**
   * Cleanup expired and revoked tokens (for scheduled job).
   */
  async cleanupExpiredTokens(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.refreshTokenRepository.delete([
      { expiresAt: LessThan(thirtyDaysAgo) },
      { revokedAt: LessThan(thirtyDaysAgo) },
    ]);

    const count = result.affected || 0;
    if (count > 0) {
      this.logger.log(`Cleaned up ${count} expired/revoked tokens`);
    }
    return count;
  }
}
