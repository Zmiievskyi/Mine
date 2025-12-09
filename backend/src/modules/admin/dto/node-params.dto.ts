import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NodeParamsDto {
  @ApiProperty({
    description: 'User UUID v4 identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Invalid user UUID format' })
  userId: string;

  @ApiProperty({
    description: 'Node UUID v4 identifier',
    example: '987e6543-a21b-34c5-d678-012345678901',
  })
  @IsUUID('4', { message: 'Invalid node UUID format' })
  nodeId: string;
}
