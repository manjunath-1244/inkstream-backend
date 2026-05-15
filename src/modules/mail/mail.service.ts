import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendForgotPasswordEmail(email: string, token: string) {
    const url = `${this.configService.get('FRONTEND_URL', 'http://localhost:3001')}/auth/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your InkStream password',
      template: './forgot-password', // relative path from template dir
      context: {
        url,
        email,
      },
    });
  }

  async sendNotificationEmail(email: string, content: string, type: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: `New Notification: ${type.replace(/_/g, ' ')}`,
      template: './notification',
      context: {
        content,
        type: type.replace(/_/g, ' '),
      },
    });
  }
}
