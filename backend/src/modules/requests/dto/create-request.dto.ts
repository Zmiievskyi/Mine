import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { GpuType } from '../entities/node-request.entity';

export class CreateRequestDto {
  @IsEnum(GpuType)
  gpuType: GpuType;

  @IsInt()
  @Min(1)
  @Max(10)
  gpuCount: number;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
