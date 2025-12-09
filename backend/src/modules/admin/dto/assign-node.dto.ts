import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignNodeDto {
  @ApiProperty({
    example: 'gonka1abc123def456ghi789jkl012mno345pqr678stu',
    description: 'Gonka network node address',
    pattern: '^gonka1[a-z0-9]{38,}$',
  })
  @IsString()
  @Matches(/^gonka1[a-z0-9]{38,}$/, {
    message: 'Node address must be a valid Gonka address (starts with gonka1)',
  })
  nodeAddress: string;

  @ApiPropertyOptional({ example: 'Mining Node 1', description: 'Friendly node label' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 'H100', description: 'GPU type' })
  @IsOptional()
  @IsString()
  gpuType?: string;

  @ApiPropertyOptional({ example: 'inst-12345', description: 'Gcore instance ID' })
  @IsOptional()
  @IsString()
  gcoreInstanceId?: string;

  @ApiPropertyOptional({ example: 'Deployed on 2024-01', description: 'Admin notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
