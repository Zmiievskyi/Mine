import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsEmail,
  IsBoolean,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '../interfaces';

// Sanitize text input to prevent XSS attacks
const sanitizeText = ({ value }: { value: string }) =>
  typeof value === 'string' ? value.trim().replace(/[<>]/g, '') : value;

export class SubmitKycDto {
  @ApiProperty({
    enum: AccountType,
    example: AccountType.INDIVIDUAL,
    description: 'Account type: individual or company',
  })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({ example: 'John', description: 'First name' })
  @Transform(sanitizeText)
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @Transform(sanitizeText)
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Germany', description: 'Country of residence' })
  @Transform(sanitizeText)
  @IsString()
  @IsNotEmpty()
  countryOfResidence: string;

  @ApiProperty({
    example: '123 Main St, Berlin, 10115, Germany',
    description: 'Full address including country and postal code',
  })
  @Transform(sanitizeText)
  @IsString()
  @IsNotEmpty()
  address: string;

  // Company fields (required only for company accounts)
  @ApiPropertyOptional({
    example: 'Acme GmbH',
    description: 'Official company registration name (required for company accounts)',
  })
  @Transform(sanitizeText)
  @ValidateIf((o) => o.accountType === AccountType.COMPANY)
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @ApiPropertyOptional({
    example: '456 Business Ave, Munich, 80331, Germany',
    description: 'Company registration address (required for company accounts)',
  })
  @Transform(sanitizeText)
  @ValidateIf((o) => o.accountType === AccountType.COMPANY)
  @IsString()
  @IsNotEmpty()
  companyAddress?: string;

  @ApiPropertyOptional({
    example: 'HRB 123456',
    description: 'Company registration number (required for company accounts)',
  })
  @Transform(sanitizeText)
  @ValidateIf((o) => o.accountType === AccountType.COMPANY)
  @IsString()
  @IsNotEmpty()
  companyRegistrationNumber?: string;

  @ApiPropertyOptional({
    example: 'DE123456789',
    description: 'Company EU VAT number (optional)',
  })
  @Transform(sanitizeText)
  @IsOptional()
  @IsString()
  companyVatNumber?: string;

  @ApiPropertyOptional({
    example: 'Jane Smith',
    description: 'Company representative full name (leave empty if you represent the company)',
  })
  @Transform(sanitizeText)
  @IsOptional()
  @IsString()
  companyRepresentativeName?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Does the company have HQ or parent company outside country of registration? (required for company accounts)',
  })
  @ValidateIf((o) => o.accountType === AccountType.COMPANY)
  @IsBoolean()
  hasParentCompanyAbroad?: boolean;

  @ApiPropertyOptional({
    example: '/api/uploads/kyc/user123_1234567890_document.pdf',
    description: 'URL of uploaded residency document',
  })
  @IsOptional()
  @IsString()
  residencyDocumentUrl?: string;

  @ApiProperty({
    example: false,
    description: 'Consent to receive marketing communications',
  })
  @IsBoolean()
  marketingConsent: boolean;
}
