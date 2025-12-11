import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TelegramAuthDto {
  @ApiProperty({ example: '123456789', description: 'Telegram user ID' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: 'John', description: 'User first name' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'User last name' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: 'johndoe', description: 'Telegram username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    example: 'https://t.me/i/userpic/320/photo.jpg',
    description: 'User avatar URL',
  })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiProperty({ example: 1702000000, description: 'Unix timestamp of authentication' })
  @IsNumber()
  auth_date: number;

  @ApiProperty({
    example: 'abc123...',
    description: 'HMAC-SHA256 hash for verification',
  })
  @IsString()
  hash: string;
}

// Interface for type safety in service
export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}
