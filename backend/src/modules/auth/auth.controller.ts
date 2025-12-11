import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import type { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, VerifyEmailDto, TelegramAuthDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleProfile } from './strategies/google.strategy';
import { GitHubProfile } from './strategies/github.strategy';

// Extend Express Request to include cookies
interface RequestWithCookies extends ExpressRequest {
  cookies: { refresh_token?: string };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly REFRESH_TOKEN_COOKIE = 'refresh_token';

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  /**
   * Set refresh token as HttpOnly cookie.
   */
  private setRefreshTokenCookie(res: Response, refreshToken: string, expiresAt: Date): void {
    const isSecure = this.configService.get<boolean>('jwt.cookieSecure') ?? false;
    const domain = this.configService.get<string>('jwt.cookieDomain');

    res.cookie(this.REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      path: '/api/auth', // Only sent to auth endpoints
      expires: expiresAt,
      ...(domain && { domain }),
    });
  }

  /**
   * Clear refresh token cookie.
   */
  private clearRefreshTokenCookie(res: Response): void {
    const domain = this.configService.get<string>('jwt.cookieDomain');

    res.clearCookie(this.REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      path: '/api/auth',
      ...(domain && { domain }),
    });
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    // Generate token pair and set refresh token cookie
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.generateTokenPair(
        result.user,
        true, // New registrations get "remember me" by default
        req.headers['user-agent'] as string,
        req.ip,
      );

    this.setRefreshTokenCookie(res, refreshToken, expiresAt);

    return {
      user: result.user,
      accessToken,
    };
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Generate token pair and set refresh token cookie
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.generateTokenPair(
        result.user,
        loginDto.rememberMe ?? false,
        req.headers['user-agent'] as string,
        req.ip,
      );

    this.setRefreshTokenCookie(res, refreshToken, expiresAt);

    return {
      user: result.user,
      accessToken,
    };
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({
    status: 200,
    description: 'Returns new access token',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      this.clearRefreshTokenCookie(res);
      throw new UnauthorizedException('No refresh token provided');
    }

    const { accessToken, refreshToken: newRefreshToken, expiresAt } =
      await this.authService.refreshAccessToken(
        refreshToken,
        req.headers['user-agent'] as string,
        req.ip,
      );

    this.setRefreshTokenCookie(res, newRefreshToken, expiresAt);

    return { accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    this.clearRefreshTokenCookie(res);

    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.authService.validateUser(req.user.id);
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify email with PIN code' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        verified: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Too many failed attempts or account locked' })
  @ApiResponse({ status: 410, description: 'Verification code expired' })
  @ApiResponse({ status: 422, description: 'Invalid verification code' })
  async verifyEmail(@Body() dto: VerifyEmailDto, @Request() req) {
    return this.authService.verifyEmail(req.user.id, dto.code);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email already verified' })
  async resendVerification(@Request() req) {
    return this.authService.resendVerification(req.user.id);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  googleAuth() {
    // Guard redirects to Google OAuth
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleCallback(
    @Req() req: ExpressRequest & { user: GoogleProfile },
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('google.frontendUrl') ||
      'http://localhost:4200';

    try {
      const result = await this.authService.googleLogin(req.user);

      // Generate token pair with refresh token
      const { accessToken, refreshToken, expiresAt } =
        await this.authService.generateTokenPair(
          result.user,
          true, // OAuth logins get "remember me" by default
          req.headers['user-agent'] as string,
          req.ip,
        );

      // Set refresh token cookie
      this.setRefreshTokenCookie(res, refreshToken, expiresAt);

      // Use URL fragment (#) for access token (security):
      // - Fragments are NOT sent to server in HTTP requests
      // - Fragments are NOT included in Referrer header
      // - Fragments are NOT logged in server access logs
      const params = new URLSearchParams({
        token: accessToken,
        user: JSON.stringify(result.user),
      });

      res.redirect(`${frontendUrl}/auth/oauth-callback#${params.toString()}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Authentication failed';
      res.redirect(
        `${frontendUrl}/auth/login?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth' })
  githubAuth() {
    // Guard redirects to GitHub OAuth
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiExcludeEndpoint()
  async githubCallback(
    @Req() req: ExpressRequest & { user: GitHubProfile },
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('github.frontendUrl') ||
      'http://localhost:4200';

    try {
      const result = await this.authService.githubLogin(req.user);

      // Generate token pair with refresh token
      const { accessToken, refreshToken, expiresAt } =
        await this.authService.generateTokenPair(
          result.user,
          true, // OAuth logins get "remember me" by default
          req.headers['user-agent'] as string,
          req.ip,
        );

      // Set refresh token cookie
      this.setRefreshTokenCookie(res, refreshToken, expiresAt);

      const params = new URLSearchParams({
        token: accessToken,
        user: JSON.stringify(result.user),
      });

      res.redirect(`${frontendUrl}/auth/oauth-callback#${params.toString()}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Authentication failed';
      res.redirect(
        `${frontendUrl}/auth/login?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  @Post('telegram/verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify Telegram login data and authenticate' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token and user',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired Telegram authentication' })
  async telegramVerify(
    @Body() telegramAuthDto: TelegramAuthDto,
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.telegramLogin(telegramAuthDto);

    // Generate token pair and set refresh token cookie
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.generateTokenPair(
        result.user,
        true, // Telegram logins get "remember me" by default
        req.headers['user-agent'] as string,
        req.ip,
      );

    this.setRefreshTokenCookie(res, refreshToken, expiresAt);

    return {
      user: result.user,
      accessToken,
    };
  }
}
