import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { getVerificationEmailTemplate } from './templates/verification.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not configured. Email sending will be disabled.',
      );
    }

    this.resend = new Resend(apiKey);
    this.fromEmail =
      this.configService.get<string>('resend.fromEmail') ||
      'noreply@minegnk.com';
    this.fromName =
      this.configService.get<string>('resend.fromName') || 'MineGNK';
  }

  async sendVerificationEmail(
    to: string,
    code: string,
    userName?: string,
  ): Promise<void> {
    const apiKey = this.configService.get<string>('resend.apiKey');

    if (!apiKey) {
      this.logger.warn(
        `Skipping email send to ${to} (Resend API key not configured)`,
      );
      this.logger.debug(`Verification code: ${code}`);
      return;
    }

    try {
      const { subject, html } = getVerificationEmailTemplate(code, userName);

      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      this.logger.log(`Verification email sent to ${to} (ID: ${result.data?.id})`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}:`, error);
      throw error;
    }
  }
}
