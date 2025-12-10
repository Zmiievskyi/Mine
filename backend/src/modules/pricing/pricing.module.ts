import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service';
import { PricingConfig } from './entities/pricing-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PricingConfig])],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
