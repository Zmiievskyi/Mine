import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { AuthOAuthService } from './auth-oauth.service';
import { AuthScheduler } from './auth.scheduler';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { EmailVerifiedGuard } from './guards/email-verified.guard';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    UsersModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        // Use short-lived access token (default: 15 min)
        const accessTokenExpiresIn =
          configService.get<string>('jwt.accessTokenExpiresIn') || '15m';
        return {
          secret: configService.get<string>('jwt.secret'),
          signOptions: {
            // Cast to any to allow string format like '15m', '7d'
            expiresIn: accessTokenExpiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    AuthOAuthService,
    AuthScheduler,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    JwtAuthGuard,
    EmailVerifiedGuard,
  ],
  exports: [AuthService, JwtAuthGuard, EmailVerifiedGuard],
})
export class AuthModule {}

export { JwtAuthGuard, EmailVerifiedGuard } from './guards';
