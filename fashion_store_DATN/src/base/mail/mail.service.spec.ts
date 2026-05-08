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
  it('sendWelcomeEmail goi sendMail voi template welcome va context name', async () => {
    // Muc tieu: xac minh ham gui mail chao mung dung template + context.
    // Input: to, name.
    // Ky vong: sendMail duoc goi voi to/subject/template/context dung gia tri.
    mailerServiceMock.sendMail.mockResolvedValue(undefined);

    await service.sendWelcomeEmail('user@example.com', 'Nguyen Van A');

    // CheckDB/ExternalCall: xac minh payload gui sang mail provider dung.
    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerServiceMock.sendMail).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject:
        'Chào mừng bạn đến với hệ thống của chúng tôi 🎉',
      template: './welcome',
      context: {
        name: 'Nguyen Van A',
      },
    });
  });

  // Test Case ID: TC_MAIL_SERVICE_002
  it('sendPlainEmail goi sendMail voi to/subject/text', async () => {
    // Muc tieu: xac minh ham gui plain text email dung payload.
    // Input: to, subject, text.
    // Ky vong: sendMail duoc goi voi 3 truong to/subject/text.
    mailerServiceMock.sendMail.mockResolvedValue(undefined);

    await service.sendPlainEmail(
      'notify@example.com',
      'Thong bao he thong',
      'Noi dung thong bao',
    );

    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerServiceMock.sendMail).toHaveBeenCalledWith({
      to: 'notify@example.com',
      subject: 'Thong bao he thong',
      text: 'Noi dung thong bao',
    });
  });

  // Test Case ID: TC_MAIL_SERVICE_003
  it('sendWelcomeEmail throw lai loi neu sendMail that bai', async () => {
    // Muc tieu: dam bao service khong nuot loi khi provider gui mail loi.
    // Input: sendMail nem exception.
    // Ky vong: exception duoc throw ra cho layer tren xu ly.
    const mailError = new Error('SMTP unreachable');
    mailerServiceMock.sendMail.mockRejectedValue(mailError);

    await expect(
      service.sendWelcomeEmail('user@example.com', 'User A'),
    ).rejects.toThrow('SMTP unreachable');
  });

  // Test Case ID: TC_MAIL_SERVICE_004
  it('sendPlainEmail throw lai loi neu sendMail that bai', async () => {
    const mailError = new Error('Send failed');
    mailerServiceMock.sendMail.mockRejectedValue(mailError);

    await expect(
      service.sendPlainEmail('user@example.com', 'Sub', 'Body'),
    ).rejects.toThrow('Send failed');
  });
});
