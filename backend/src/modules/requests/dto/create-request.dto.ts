import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
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
  region?: string;

  @ApiPropertyOptional({ example: 'Need for ML training', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  message?: string;
}
