// src/base/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from '@base/mail/mail.service';
import { config } from '@config';
import { MailController } from '@base/mail/mail.controller';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: config.MAIL.HOST,
          port: config.MAIL.PORT,
          secure: config.MAIL.SECURE,
          auth: {
            user: config.MAIL.USER,
            pass: config.MAIL.PASS,
          },
        },
        defaults: {
          from: config.MAIL.FROM,
        },
        template: {
          dir: join(process.cwd(), 'src', 'base', 'mail', 'templates'),
          adapter: new HandlebarsAdapter(), // sử dụng handlebars cho template
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
