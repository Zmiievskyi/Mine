import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  private readonly logger = new Logger(EmailVerifiedGuard.name);

  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Fetch fresh user data to ensure emailVerified status is up-to-date
    const dbUser = await this.usersService.findById(user.id);

    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }

    if (!dbUser.emailVerified) {
      this.logger.warn(`Email verification required for user ${user.id}`);
      throw new ForbiddenException(
        'Please verify your email to access this feature',
      );
    }

    return true;
  }
}
