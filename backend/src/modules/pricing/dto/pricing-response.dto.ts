import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PricingResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'H100' })
  gpuType: string;

  @ApiPropertyOptional({ example: 2.76 })
  pricePerHour: number | null;

  @ApiProperty({ example: false })
  isContactSales: boolean;

  @ApiProperty({ example: 2 })
  displayOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: 'admin@example.com' })
  updatedByEmail?: string;
}

export class PublicPricingDto {
  @ApiProperty({ example: 'H100' })
  gpuType: string;

  @ApiPropertyOptional({ example: 2.76 })
  pricePerHour: number | null;

  @ApiProperty({ example: false })
  isContactSales: boolean;

  @ApiProperty({ example: 2 })
  displayOrder: number;
}
