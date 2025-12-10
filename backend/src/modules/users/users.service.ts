import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AuthProvider } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
    });
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, data);
    return this.findById(id);
  }

  async getUserWithNodes(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['nodes'],
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async createFromGoogle(data: {
    email: string;
    name?: string;
    googleId: string;
    avatarUrl?: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email,
      name: data.name || null,
      googleId: data.googleId,
      avatarUrl: data.avatarUrl || null,
      provider: AuthProvider.GOOGLE,
      password: null,
      emailVerified: true,
    });
    return this.usersRepository.save(user);
  }

  async linkGoogleAccount(
    userId: string,
    googleId: string,
    avatarUrl?: string,
  ): Promise<User | null> {
    const updateData: Partial<User> = { googleId };
    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }
    await this.usersRepository.update(userId, updateData);
    return this.findById(userId);
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { githubId } });
  }

  async createFromGithub(data: {
    email: string;
    name?: string;
    githubId: string;
    avatarUrl?: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email,
      name: data.name || null,
      githubId: data.githubId,
      avatarUrl: data.avatarUrl || null,
      provider: AuthProvider.GITHUB,
      password: null,
      emailVerified: true,
    });
    return this.usersRepository.save(user);
  }

  async linkGithubAccount(
    userId: string,
    githubId: string,
    avatarUrl?: string,
  ): Promise<User | null> {
    const updateData: Partial<User> = { githubId };
    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }
    await this.usersRepository.update(userId, updateData);
    return this.findById(userId);
  }

  async setVerificationCode(
    userId: string,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      verificationCode: code,
      verificationCodeExpiresAt: expiresAt,
    });
  }

  async clearVerificationCode(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      verificationCode: null,
      verificationCodeExpiresAt: null,
    });
  }

  async incrementVerificationAttempts(userId: string): Promise<void> {
    await this.usersRepository.increment(
      { id: userId },
      'verificationAttempts',
      1,
    );
  }

  async lockVerification(userId: string, until: Date): Promise<void> {
    await this.usersRepository.update(userId, {
      verificationLockedUntil: until,
    });
  }

  async resetVerificationAttempts(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      verificationAttempts: 0,
      verificationLockedUntil: null,
    });
  }

  async setEmailVerified(userId: string, verified: boolean): Promise<void> {
    await this.usersRepository.update(userId, {
      emailVerified: verified,
    });
  }
}
