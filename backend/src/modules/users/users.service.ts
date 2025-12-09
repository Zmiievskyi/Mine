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
}
