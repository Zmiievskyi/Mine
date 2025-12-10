import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingConfig } from './entities/pricing-config.entity';
import { UpdatePricingDto, PricingResponseDto, PublicPricingDto } from './dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectRepository(PricingConfig)
    private pricingRepository: Repository<PricingConfig>,
  ) {}

  async getAllPricing(): Promise<PricingResponseDto[]> {
    const configs = await this.pricingRepository.find({
      relations: ['updatedBy'],
      order: { displayOrder: 'ASC' },
    });

    return configs.map((config) => this.toResponseDto(config));
  }

  async getPublicPricing(): Promise<PublicPricingDto[]> {
    const configs = await this.pricingRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });

    return configs.map((config) => ({
      gpuType: config.gpuType,
      pricePerHour: config.pricePerHour ? Number(config.pricePerHour) : null,
      isContactSales: config.isContactSales,
      displayOrder: config.displayOrder,
    }));
  }

  async updatePricing(
    gpuType: string,
    dto: UpdatePricingDto,
    adminUserId: string,
  ): Promise<PricingResponseDto> {
    const config = await this.pricingRepository.findOne({
      where: { gpuType },
      relations: ['updatedBy'],
    });

    if (!config) {
      throw new NotFoundException(`Pricing config for ${gpuType} not found`);
    }

    if (dto.pricePerHour !== undefined) {
      config.pricePerHour = dto.pricePerHour?.toString() ?? null;
    }
    if (dto.isContactSales !== undefined) {
      config.isContactSales = dto.isContactSales;
    }
    if (dto.isActive !== undefined) {
      config.isActive = dto.isActive;
    }

    // Track who made the update (set relation by ID without loading full User)
    // TypeORM will handle the foreign key assignment via the relation object
    config.updatedBy = { id: adminUserId } as User;

    const saved = await this.pricingRepository.save(config);

    this.logger.log(
      `Pricing updated: ${gpuType} -> €${dto.pricePerHour ?? 'Contact Sales'}/hr by admin ${adminUserId}`,
    );

    return this.toResponseDto(saved);
  }

  private toResponseDto(config: PricingConfig): PricingResponseDto {
    return {
      id: config.id,
      gpuType: config.gpuType,
      pricePerHour: config.pricePerHour ? Number(config.pricePerHour) : null,
      isContactSales: config.isContactSales,
      displayOrder: config.displayOrder,
      isActive: config.isActive,
      updatedAt: config.updatedAt,
      updatedByEmail: config.updatedBy?.email,
    };
  }
}
