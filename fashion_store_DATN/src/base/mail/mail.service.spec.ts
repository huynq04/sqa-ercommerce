import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;

  // Mock MailerService de unit test chi kiem tra payload gui mail.
  const mailerServiceMock = {
    sendMail: jest.fn<(...args: any[]) => Promise<void>>(),
  };

  beforeEach(async () => {
    // Lam sach lich su mock truoc moi testcase.
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mailerServiceMock,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    // Rollback mock state sau moi testcase.
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_MAIL_SERVICE_001
  it('[TC_MAIL_SERVICE_001] sendWelcomeEmail gọi MailerService.sendMail đúng template và context name', async () => {
    const to = 'user@example.com';
    const name = 'Nguyen Van A';

    mailerServiceMock.sendMail.mockResolvedValue(undefined);

    await service.sendWelcomeEmail(to, name);

    const expectedPayload = {
      to,
      subject: 'Chào mừng bạn đến với hệ thống của chúng tôi 🎉',
      template: './welcome',
      context: {
        name,
      },
    };

    // CheckDB/ExternalCall: verify call tới mail provider đúng payload
    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerServiceMock.sendMail).toHaveBeenCalledWith(expectedPayload);
  });

  // Test Case ID: TC_MAIL_SERVICE_002
  it('[TC_MAIL_SERVICE_002] sendPlainEmail gọi MailerService.sendMail đúng payload (to/subject/text)', async () => {
    const to = 'notify@example.com';
    const subject = 'Thong bao he thong';
    const text = 'Noi dung thong bao';

    mailerServiceMock.sendMail.mockResolvedValue(undefined);

    await service.sendPlainEmail(to, subject, text);

    const expectedPayload = {
      to,
      subject,
      text,
    };

    // CheckDB/ExternalCall: verify call tới mail provider đúng dữ liệu
    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerServiceMock.sendMail).toHaveBeenCalledWith(expectedPayload);
  });

  // Test Case ID: TC_MAIL_SERVICE_003
  it('[TC_MAIL_SERVICE_003] sendWelcomeEmail phải throw lỗi khi MailerService.sendMail thất bại', async () => {
    const to = 'user@example.com';
    const name = 'User A';

    const mailError = new Error('SMTP unreachable');
    mailerServiceMock.sendMail.mockRejectedValue(mailError);

    // CheckDB/ExternalCall: mô phỏng failure từ mail provider
    await expect(service.sendWelcomeEmail(to, name)).rejects.toThrow(
      'SMTP unreachable',
    );

    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerServiceMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to,
        subject: 'Chào mừng bạn đến với hệ thống của chúng tôi 🎉',
        template: './welcome',
        context: { name },
      }),
    );
  });

  // Test Case ID: TC_MAIL_SERVICE_004
  it('[TC_MAIL_SERVICE_004] sendPlainEmail phải throw lỗi khi MailerService.sendMail thất bại', async () => {
    const to = 'user@example.com';
    const subject = 'Sub';
    const text = 'Body';

    const mailError = new Error('Send failed');
    mailerServiceMock.sendMail.mockRejectedValue(mailError);

    // CheckDB/ExternalCall: mô phỏng lỗi từ mail provider
    await expect(service.sendPlainEmail(to, subject, text)).rejects.toThrow(
      'Send failed',
    );

    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerServiceMock.sendMail).toHaveBeenCalledWith({
      to,
      subject,
      text,
    });
  });
});
