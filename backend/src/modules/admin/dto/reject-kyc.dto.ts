import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectKycDto {
  @ApiProperty({
    example: 'Documents are unclear. Please resubmit with higher quality images.',
    description: 'Reason for rejecting the KYC application',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
