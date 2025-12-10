import { IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePricingDto {
  @ApiPropertyOptional({
    example: 1.67,
    description: 'Price per hour in EUR (null for contact sales)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  pricePerHour?: number | null;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether to show "Contact Sales" instead of price',
  })
  @IsOptional()
  @IsBoolean()
  isContactSales?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this GPU is visible on landing page',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
