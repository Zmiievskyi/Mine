import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '../entities/node-request.entity';

export class UpdateRequestDto {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
