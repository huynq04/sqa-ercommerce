// src/mailer/mailer.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { MailService } from '@base/mail/mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('send')
  async sendMail(@Query('to') to: string) {
    await this.mailService.sendWelcomeEmail(to, 'Dev');
    return { message: `Đã gửi email đến ${to}` };
  }
}
