import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { SubmitKycDto } from './dto';
import { KycStatus, KycData } from './interfaces';

export interface KycStatusResponse {
  status: KycStatus;
  data: KycData | null;
  submittedAt: Date | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('kyc')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user KYC status' })
  @ApiResponse({ status: 200, description: 'KYC status retrieved' })
  async getKycStatus(@Request() req): Promise<KycStatusResponse> {
    return this.usersService.getKycStatus(req.user.id);
  }

  @Post('kyc')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit KYC verification form' })
  @ApiResponse({ status: 201, description: 'KYC submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or already verified' })
  async submitKyc(
    @Request() req,
    @Body() kycDto: SubmitKycDto,
  ): Promise<KycStatusResponse> {
    await this.usersService.submitKyc(req.user.id, kycDto);
    return this.usersService.getKycStatus(req.user.id);
  }
}
