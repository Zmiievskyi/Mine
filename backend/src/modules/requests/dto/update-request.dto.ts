import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '../entities/node-request.entity';

export class UpdateRequestDto {
  @ApiPropertyOptional({
    enum: RequestStatus,
    example: RequestStatus.APPROVED,
    description: 'New request status',
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({ example: 'Approved for deployment', description: 'Admin notes' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
