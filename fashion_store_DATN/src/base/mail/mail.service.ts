// src/base/mailer/mailer.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(to: string, name: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Chào mừng bạn đến với hệ thống của chúng tôi 🎉',
      template: './welcome', // sẽ tìm file `welcome.hbs`
      context: {
        name, // biến dùng trong template
      },
    });
  }

  async sendPlainEmail(to: string, subject: string, text: string) {
    await this.mailerService.sendMail({
      to,
      subject,
      text,
    });
  }
}
