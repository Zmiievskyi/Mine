import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto';

export class AdminRequestsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by request status',
    enum: ['pending', 'approved', 'rejected', 'completed', 'all'],
  })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'completed', 'all'])
  status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'all';

  @ApiPropertyOptional({ description: 'Filter by GPU type (3080, 4090, H100, H200)' })
  @IsOptional()
  @IsString()
  gpuType?: string;

  @ApiPropertyOptional({ description: 'Search by user email' })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({ description: 'Filter from date (ISO format)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO format)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['createdAt', 'status', 'gpuType'],
  })
  @IsOptional()
  @IsIn(['createdAt', 'status', 'gpuType'])
  sortBy?: 'createdAt' | 'status' | 'gpuType';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
