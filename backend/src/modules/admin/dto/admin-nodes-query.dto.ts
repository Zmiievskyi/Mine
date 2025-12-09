import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto';

export class AdminNodesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by node status',
    enum: ['healthy', 'jailed', 'offline', 'all'],
  })
  @IsOptional()
  @IsIn(['healthy', 'jailed', 'offline', 'all'])
  status?: 'healthy' | 'jailed' | 'offline' | 'all';

  @ApiPropertyOptional({ description: 'Filter by GPU type (3080, 4090, H100, H200)' })
  @IsOptional()
  @IsString()
  gpuType?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Search by node address' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['earnings', 'uptime', 'user', 'createdAt'],
  })
  @IsOptional()
  @IsIn(['earnings', 'uptime', 'user', 'createdAt'])
  sortBy?: 'earnings' | 'uptime' | 'user' | 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
