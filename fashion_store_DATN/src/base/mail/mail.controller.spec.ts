import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MailController } from './mail.controller';
import { MailService } from './mail.service';

describe('MailController', () => {
  let controller: MailController;
  const mailServiceMock = {
    sendWelcomeEmail: jest.fn<(...args: any[]) => Promise<void>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new MailController(mailServiceMock as unknown as MailService);
  });

  it('sends welcome email and returns success message', async () => {
    mailServiceMock.sendWelcomeEmail.mockResolvedValue(undefined);

    const result = await controller.sendMail('user@example.com');

    expect(mailServiceMock.sendWelcomeEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Dev',
    );
    expect(result).toEqual({ message: 'Đã gửi email đến user@example.com' });
  });
});
