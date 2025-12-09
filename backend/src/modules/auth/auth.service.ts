import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { GoogleProfile } from './strategies/google.strategy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const tokens = this.generateTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
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
      throw new UnauthorizedException('Invalid credentials');
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
    };
  }

  async googleLogin(googleProfile: GoogleProfile) {
    if (!googleProfile.email) {
      throw new UnauthorizedException('Email is required for Google sign-in');
    }

    // Check if user exists by Google ID
    let user = await this.usersService.findByGoogleId(googleProfile.googleId);

    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException('Account is disabled');
      }
      return this.createAuthResponse(user);
    }

    // Check if user exists by email (auto-link scenario)
    user = await this.usersService.findByEmail(googleProfile.email);

    if (user) {
      if (!user.isActive) {
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
      return this.createAuthResponse(updatedUser);
    }

    // Create new user from Google profile
    user = await this.usersService.createFromGoogle({
      email: googleProfile.email,
      name: googleProfile.name,
      googleId: googleProfile.googleId,
      avatarUrl: googleProfile.avatarUrl,
    });

    return this.createAuthResponse(user);
  }

  private createAuthResponse(user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    avatarUrl?: string | null;
    provider?: string;
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
}
