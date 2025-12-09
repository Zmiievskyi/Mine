import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard implements CanActivate {
  private googleGuard: CanActivate | null = null;

  constructor(private configService: ConfigService) {
    const enabled = this.configService.get<boolean>('google.enabled');
    if (enabled) {
      this.googleGuard = new (AuthGuard('google'))();
    }
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    if (!this.googleGuard) {
      throw new BadRequestException(
        'Google sign-in is not configured. Please contact administrator.',
      );
    }

    return this.googleGuard.canActivate(context) as boolean | Promise<boolean>;
  }
}
