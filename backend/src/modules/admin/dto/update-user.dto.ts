import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole, example: UserRole.ADMIN, description: 'User role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true, description: 'Whether user is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
