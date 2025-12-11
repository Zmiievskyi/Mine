import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AuthProvider } from './entities/user.entity';
import { KycStatus, KycData } from './interfaces';
import { SubmitKycDto } from './dto';

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

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { telegramId } });
  }

  async createFromTelegram(data: {
    telegramId: string;
    name?: string;
    telegramUsername?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: null, // Telegram doesn't provide email
      name: data.name || data.telegramUsername || null,
      telegramId: data.telegramId,
      telegramUsername: data.telegramUsername || null,
      avatarUrl: data.avatarUrl || null,
      provider: AuthProvider.TELEGRAM,
      password: null,
      emailVerified: false, // N/A for Telegram users
    });
    return this.usersRepository.save(user);
  }

  async linkTelegramAccount(
    userId: string,
    telegramId: string,
    telegramUsername?: string,
    avatarUrl?: string,
  ): Promise<User | null> {
    const updateData: Partial<User> = { telegramId };
    if (telegramUsername) {
      updateData.telegramUsername = telegramUsername;
    }
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

  // KYC Methods
  async getKycStatus(userId: string): Promise<{
    status: KycStatus;
    data: KycData | null;
    submittedAt: Date | null;
    verifiedAt: Date | null;
    rejectionReason: string | null;
  }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return {
      status: user.kycStatus,
      data: user.kycData,
      submittedAt: user.kycSubmittedAt,
      verifiedAt: user.kycVerifiedAt,
      rejectionReason: user.kycRejectionReason,
    };
  }

  async submitKyc(userId: string, kycDto: SubmitKycDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Don't allow resubmission if already verified
    if (user.kycStatus === KycStatus.VERIFIED) {
      throw new BadRequestException('KYC is already verified');
    }

    const kycData: KycData = {
      accountType: kycDto.accountType,
      firstName: kycDto.firstName,
      lastName: kycDto.lastName,
      email: kycDto.email,
      countryOfResidence: kycDto.countryOfResidence,
      address: kycDto.address,
      companyName: kycDto.companyName,
      companyAddress: kycDto.companyAddress,
      companyRegistrationNumber: kycDto.companyRegistrationNumber,
      companyVatNumber: kycDto.companyVatNumber,
      companyRepresentativeName: kycDto.companyRepresentativeName,
      hasParentCompanyAbroad: kycDto.hasParentCompanyAbroad,
      residencyDocumentUrl: kycDto.residencyDocumentUrl,
      marketingConsent: kycDto.marketingConsent,
    };

    await this.usersRepository.update(userId, {
      kycStatus: KycStatus.PENDING,
      kycData,
      kycSubmittedAt: new Date(),
      kycRejectionReason: null, // Clear previous rejection reason
    });

    return this.findById(userId) as Promise<User>;
  }

  async verifyKyc(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.kycStatus !== KycStatus.PENDING) {
      throw new BadRequestException('KYC is not pending verification');
    }

    await this.usersRepository.update(userId, {
      kycStatus: KycStatus.VERIFIED,
      kycVerifiedAt: new Date(),
    });

    return this.findById(userId) as Promise<User>;
  }

  async rejectKyc(userId: string, reason: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.kycStatus !== KycStatus.PENDING) {
      throw new BadRequestException('KYC is not pending verification');
    }

    await this.usersRepository.update(userId, {
      kycStatus: KycStatus.REJECTED,
      kycRejectionReason: reason,
    });

    return this.findById(userId) as Promise<User>;
  }
}
