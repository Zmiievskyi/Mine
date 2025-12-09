import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GpuType } from '../entities/node-request.entity';

export class CreateRequestDto {
  @ApiProperty({
    enum: GpuType,
    example: GpuType.RTX_4090,
    description: 'GPU type for the node',
  })
  @IsEnum(GpuType)
  gpuType: GpuType;

  @ApiProperty({ example: 1, minimum: 1, maximum: 10, description: 'Number of GPUs' })
  @IsInt()
  @Min(1)
  @Max(10)
  gpuCount: number;

  @ApiPropertyOptional({ example: 'eu-west', description: 'Preferred region' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Region must be at most 100 characters' })
  region?: string;

  @ApiPropertyOptional({ example: 'Need for ML training', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Message must be at most 500 characters' })
  @Matches(/^[^<>]*$/, { message: 'Message cannot contain HTML tags' })
  message?: string;
}
