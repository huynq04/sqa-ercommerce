import { Test, TestingModule } from '@nestjs/testing';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { MailController } from './mail.controller';
import { MailService } from './mail.service';

describe('MailController', () => {
  let controller: MailController;

  const mailServiceMock = {
    sendWelcomeEmail: jest.fn<(...args: any[]) => Promise<void>>(),
  };

  beforeEach(async () => {
    // Lam sach lich su mock truoc moi testcase.
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
  });

  afterEach(() => {
    // Rollback mock state sau moi testcase.
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_MAIL_CONTROLLER_001
  it('[TC_MAIL_CONTROLLER_001] sendMail gọi MailService.sendWelcomeEmail đúng tham số và trả về message', async () => {
    const to = 'user@example.com';

    mailServiceMock.sendWelcomeEmail.mockResolvedValue(undefined);

    const result = await controller.sendMail(to);

    // ExternalCall validation
    expect(mailServiceMock.sendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(mailServiceMock.sendWelcomeEmail).toHaveBeenCalledWith(to, 'Dev');

    // Response validation
    expect(result).toEqual({ message: `Đã gửi email đến ${to}` });
  });

  // Test Case ID: TC_MAIL_CONTROLLER_002
  it('[TC_MAIL_CONTROLLER_002] sendMail phải throw lỗi khi MailService.sendWelcomeEmail thất bại', async () => {
    const to = 'user@example.com';

    const mailError = new Error('SMTP unreachable');
    mailServiceMock.sendWelcomeEmail.mockRejectedValue(mailError);

    await expect(controller.sendMail(to)).rejects.toThrow('SMTP unreachable');

    expect(mailServiceMock.sendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(mailServiceMock.sendWelcomeEmail).toHaveBeenCalledWith(to, 'Dev');
  });
});
