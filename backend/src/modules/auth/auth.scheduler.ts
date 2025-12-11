import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthTokenService } from './auth-token.service';

/**
 * Scheduler for auth-related cleanup tasks.
 * Runs token cleanup job daily at 3 AM.
 */
@Injectable()
export class AuthScheduler {
  private readonly logger = new Logger(AuthScheduler.name);

  constructor(private authTokenService: AuthTokenService) {}

  /**
   * Cleanup expired and revoked refresh tokens.
   * Runs daily at 3:00 AM to minimize impact on active users.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleTokenCleanup(): Promise<void> {
    this.logger.log('Starting scheduled token cleanup...');
    try {
      const count = await this.authTokenService.cleanupExpiredTokens();
      this.logger.log(`Token cleanup completed: ${count} tokens removed`);
    } catch (error) {
      this.logger.error('Token cleanup failed:', error);
    }
  }
}
