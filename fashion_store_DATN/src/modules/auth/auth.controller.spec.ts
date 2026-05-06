import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '@modules/user/services/user.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('AuthController', () => {
  let controller: AuthController;

  // Cum mock cho cac dependency cua controller.
  // Muc tieu: chi test logic mapping input/output cua controller,
  // khong phu thuoc vao service that hay database that.
  const authServiceMock = {
    signIn: jest.fn<(...args: any[]) => Promise<any>>(),
    register: jest.fn<(...args: any[]) => Promise<any>>(),
    verifyOtp: jest.fn<(...args: any[]) => Promise<any>>(),
    forgotPassword: jest.fn<(...args: any[]) => Promise<any>>(),
    resetPassword: jest.fn<(...args: any[]) => Promise<any>>(),
    refresh: jest.fn<(...args: any[]) => Promise<any>>(),
    logout: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const usersServiceMock = {
    findUsersWithBirthday: jest.fn<(...args: any[]) => Promise<any[]>>(),
  };

  const mailerServiceMock = {
    sendMail: jest.fn<(...args: any[]) => Promise<void>>(),
  };

  beforeEach(() => {
    // Reset toan bo lich su goi ham truoc moi test case de tranh anh huong lan nhau.
    jest.clearAllMocks();

    controller = new AuthController(
      authServiceMock as unknown as AuthService,
      usersServiceMock as unknown as UsersService,
      mailerServiceMock as unknown as MailerService,
    );
  });

  afterEach(() => {
    // Rollback: controller unit test chi dung mock, khong ghi DB that.
    // Vi vay rollback duoc dam bao bang cach reset mock sau moi test.
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_AUTH_CTRL_001
  it('[TC_001] gọi authService.signIn với email/password hợp lệ và trả access_token', async () => {
    const loginDto = {
      email: 'user@example.com',
      password: '12345678',
    };

    const expectedResponse = { access_token: 'jwt-token' };

    authServiceMock.signIn.mockResolvedValue(expectedResponse);

    const result = await controller.signIn(loginDto);

    expect(authServiceMock.signIn).toHaveBeenCalledTimes(1);
    expect(authServiceMock.signIn).toHaveBeenCalledWith(
      loginDto.email,
      loginDto.password,
    );

    expect(result).toEqual(expectedResponse);

    expect(loginDto).toEqual({
      email: 'user@example.com',
      password: '12345678',
    });
  });

  // Test Case ID: TC_AUTH_CTRL_002
  it('[TC_002] gọi authService.register với DTO hợp lệ và trả user', async () => {
    const registerDto = {
      name: 'User A',
      email: 'a@example.com',
      password: '123456',
      phone: '0123456789',
      address: 'HN',
    };

    const expectedResponse = {
      id: 10,
      ...registerDto,
    };

    authServiceMock.register.mockResolvedValue(expectedResponse);

    const result = await controller.register(registerDto);

    expect(authServiceMock.register).toHaveBeenCalledTimes(1);

    expect(authServiceMock.register).toHaveBeenCalledWith(registerDto);

    expect(result).toEqual(expectedResponse);

    expect(registerDto).toEqual({
      name: 'User A',
      email: 'a@example.com',
      password: '123456',
      phone: '0123456789',
      address: 'HN',
    });
  });
  // Test Case ID: TC_AUTH_CTRL_003
  it('[TC_003] khi service register lỗi → controller propagate error', async () => {
    const registerDto = {
      name: 'User A',
      email: 'a@example.com',
      password: '123456',
      phone: '0123456789',
      address: 'HN',
    };

    authServiceMock.register.mockRejectedValue(
      new Error('Email already exists'),
    );

    await expect(controller.register(registerDto)).rejects.toThrow(
      'Email already exists',
    );

    expect(authServiceMock.register).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_AUTH_CTRL_004
  it('[TC_004] gọi authService.verifyOtp với email/otp hợp lệ và trả kết quả', async () => {
    // Arrange
    const verifyOtpDto = {
      email: 'a@example.com',
      otp: '123456',
    };

    const expectedResponse = {
      message: 'Xác nhận thành công',
    };

    authServiceMock.verifyOtp.mockResolvedValue(expectedResponse);

    const result = await controller.verify(verifyOtpDto);

    expect(authServiceMock.verifyOtp).toHaveBeenCalledTimes(1);

    expect(authServiceMock.verifyOtp).toHaveBeenCalledWith(
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );

    expect(result).toEqual(expectedResponse);

    expect(verifyOtpDto).toEqual({
      email: 'a@example.com',
      otp: '123456',
    });
  });

  // Test Case ID: TC_AUTH_CTRL_005
  it('[TC_005] OTP sai → service throw error', async () => {
    const verifyOtpDto = {
      email: 'a@example.com',
      otp: '000000',
    };

    authServiceMock.verifyOtp.mockRejectedValue(new Error('OTP không hợp lệ'));

    await expect(controller.verify(verifyOtpDto)).rejects.toThrow(
      'OTP không hợp lệ',
    );

    expect(authServiceMock.verifyOtp).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_AUTH_CTRL_006
  it('[TC_006] gọi authService.forgotPassword với email hợp lệ và trả thông báo', async () => {
    const forgotPasswordDto = {
      email: 'a@example.com',
    };

    const expectedResponse = {
      message: 'OTP reset mật khẩu đã gửi',
    };

    authServiceMock.forgotPassword.mockResolvedValue(expectedResponse);

    const result = await controller.forgot(forgotPasswordDto);

    expect(authServiceMock.forgotPassword).toHaveBeenCalledTimes(1);

    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith(
      forgotPasswordDto,
    );

    expect(result).toEqual(expectedResponse);

    expect(forgotPasswordDto).toEqual({
      email: 'a@example.com',
    });
  });

  // Test Case ID: TC_AUTH_CTRL_007
  it('[TC_007] khi service lỗi → controller propagate error', async () => {
    const forgotPasswordDto = {
      email: 'a@example.com',
    };

    authServiceMock.forgotPassword.mockRejectedValue(
      new Error('Email không tồn tại'),
    );

    await expect(controller.forgot(forgotPasswordDto)).rejects.toThrow(
      'Email không tồn tại',
    );

    expect(authServiceMock.forgotPassword).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_AUTH_CTRL_008
  it('[TC_008] gọi authService.resetPassword với DTO hợp lệ và trả thông báo thành công', async () => {
    const resetPasswordDto = {
      email: 'a@example.com',
      otp: '123456',
      newPassword: 'new-password',
    };

    const expectedResponse = {
      message: 'Đổi mật khẩu thành công',
    };

    authServiceMock.resetPassword.mockResolvedValue(expectedResponse);

    const result = await controller.reset(resetPasswordDto);

    expect(authServiceMock.resetPassword).toHaveBeenCalledTimes(1);

    expect(authServiceMock.resetPassword).toHaveBeenCalledWith(
      resetPasswordDto,
    );

    expect(result).toEqual(expectedResponse);

    expect(resetPasswordDto).toEqual({
      email: 'a@example.com',
      otp: '123456',
      newPassword: 'new-password',
    });
  });

  // Test Case ID: TC_AUTH_CTRL_009
  it('[TC_009] OTP sai → controller propagate error', async () => {
    const resetPasswordDto = {
      email: 'a@example.com',
      otp: '000000',
      newPassword: 'new-password',
    };

    authServiceMock.resetPassword.mockRejectedValue(
      new Error('OTP không hợp lệ hoặc đã hết hạn'),
    );

    await expect(controller.reset(resetPasswordDto)).rejects.toThrow(
      'OTP không hợp lệ hoặc đã hết hạn',
    );

    expect(authServiceMock.resetPassword).toHaveBeenCalledTimes(1);
  });
  // Test Case ID: TC_AUTH_CTRL_010
  it('[TC_010] email không tồn tại → controller propagate error', async () => {
    const resetPasswordDto = {
      email: 'notfound@example.com',
      otp: '123456',
      newPassword: 'new-password',
    };

    authServiceMock.resetPassword.mockRejectedValue(
      new Error('Email không tồn tại'),
    );

    await expect(controller.reset(resetPasswordDto)).rejects.toThrow(
      'Email không tồn tại',
    );

    expect(authServiceMock.resetPassword).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_AUTH_CTRL_011
  it('[TC_011] gọi authService.refresh với userId và refreshToken hợp lệ', async () => {
    const mockRequest = {
      user: {
        sub: 7,
        refreshToken: 'refresh-token',
      },
    };

    const expectedResponse = {
      accessToken: 'new-access-token',
    };

    authServiceMock.refresh.mockResolvedValue(expectedResponse);

    const result = await controller.refresh(mockRequest as any);

    expect(authServiceMock.refresh).toHaveBeenCalledTimes(1);

    expect(authServiceMock.refresh).toHaveBeenCalledWith(
      mockRequest.user.sub,
      mockRequest.user.refreshToken,
    );

    expect(result).toEqual(expectedResponse);

    expect(mockRequest).toEqual({
      user: {
        sub: 7,
        refreshToken: 'refresh-token',
      },
    });
  });
  // Test Case ID: TC_AUTH_CTRL_012
  it('[TC_012] thiếu refreshToken → controller throw error', async () => {
    const mockRequest = {
      user: {
        sub: 7,
        refreshToken: undefined,
      },
    };

    await expect(controller.refresh(mockRequest as any)).rejects.toThrow();

    expect(authServiceMock.refresh).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_AUTH_CTRL_013
  it('[TC_013] refresh token sai → controller propagate error', async () => {
    const mockRequest = {
      user: {
        sub: 7,
        refreshToken: 'invalid-token',
      },
    };

    authServiceMock.refresh.mockRejectedValue(
      new Error('Refresh token không hợp lệ'),
    );

    await expect(controller.refresh(mockRequest as any)).rejects.toThrow(
      'Refresh token không hợp lệ',
    );

    expect(authServiceMock.refresh).toHaveBeenCalledTimes(1);
  });
  // Test Case ID: TC_AUTH_CTRL_014
  it('[TC_014] gọi authService.logout với userId hợp lệ và trả thông báo thành công', async () => {
    // Arrange
    const mockRequest = {
      user: {
        sub: 7,
      },
    };

    const expectedResponse = {
      message: 'Logout thành công',
    };

    authServiceMock.logout.mockResolvedValue(expectedResponse);

    const result = await controller.logout(mockRequest as any);

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);

    expect(authServiceMock.logout).toHaveBeenCalledWith(mockRequest.user.sub);

    expect(result).toEqual(expectedResponse);

    expect(mockRequest).toEqual({
      user: {
        sub: 7,
      },
    });
  });

  // Test Case ID: TC_AUTH_CTRL_015
  it('[TC_015] thiếu userId → controller throw error', async () => {
    const mockRequest = {
      user: {},
    };

    await expect(controller.logout(mockRequest as any)).rejects.toThrow();

    expect(authServiceMock.logout).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_AUTH_CTRL_016
  it('[TC_016] service logout lỗi → controller propagate error', async () => {
    const mockRequest = {
      user: {
        sub: 7,
      },
    };

    authServiceMock.logout.mockRejectedValue(new Error('Logout thất bại'));

    await expect(controller.logout(mockRequest as any)).rejects.toThrow(
      'Logout thất bại',
    );

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_AUTH_CTRL_017
  it('[TC_017] trả về đúng thông tin user từ req.user', () => {
    const mockRequest = {
      user: {
        sub: 1,
        email: 'profile@example.com',
      },
    };

    const result = controller.getProfile(mockRequest as any);

    expect(result).toEqual(mockRequest.user);

    expect(result).toBe(mockRequest.user);

    expect(mockRequest).toEqual({
      user: {
        sub: 1,
        email: 'profile@example.com',
      },
    });
  });

  // Test Case ID: TC_AUTH_CTRL_018
  it('[TC_018] không có user sinh nhật → trả thông báo và không gửi mail', async () => {
    const expectedResponse = 'Không có user sinh nhật hôm nay';

    usersServiceMock.findUsersWithBirthday.mockResolvedValue([]);

    const result = await controller.sendBirthdayMail();

    expect(usersServiceMock.findUsersWithBirthday).toHaveBeenCalledTimes(1);

    expect(mailerServiceMock.sendMail).not.toHaveBeenCalled();

    expect(result).toBe(expectedResponse);
  });

  // Test Case ID: TC_AUTH_CTRL_019
  it('[TC_019] gửi email cho từng user sinh nhật và trả về tổng số đã gửi', async () => {
    const birthdayUsers = [
      { email: 'u1@example.com', name: 'User 1' },
      { email: 'u2@example.com', name: 'User 2' },
    ];

    const expectedResponse = `${birthdayUsers.length} người dùng đã được chúc mừng sinh nhật.`;

    usersServiceMock.findUsersWithBirthday.mockResolvedValue(birthdayUsers);
    mailerServiceMock.sendMail.mockResolvedValue(undefined);

    const result = await controller.sendBirthdayMail();

    // 1. Lấy danh sách user đúng 1 lần
    expect(usersServiceMock.findUsersWithBirthday).toHaveBeenCalledTimes(1);

    // 2. Gửi mail đúng số lượng user
    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(
      birthdayUsers.length,
    );

    // 3. Kiểm tra payload từng lần gọi (order + nội dung)
    birthdayUsers.forEach((user, index) => {
      expect(mailerServiceMock.sendMail).toHaveBeenNthCalledWith(
        index + 1,
        expect.objectContaining({
          to: user.email,
          subject: 'Chúc mừng sinh nhật 🎉',
        }),
      );
    });

    // 4. Trả đúng message tổng kết
    expect(result).toBe(expectedResponse);
  });

  // Test Case ID: TC_AUTH_CTRL_020
  it('[TC_020] cron job log và gọi sendBirthdayMail đúng 1 lần', async () => {
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    const sendBirthdayMailSpy = jest
      .spyOn(controller, 'sendBirthdayMail')
      .mockResolvedValue('done');

    await controller.sendBirthdayMailCron();

    // 1. Log được gọi
    expect(logSpy).toHaveBeenCalledTimes(1);

    // 2. Nội dung log đúng (flexible hơn)
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cron job gửi email sinh nhật'),
    );

    // 3. Gọi business logic đúng 1 lần
    expect(sendBirthdayMailSpy).toHaveBeenCalledTimes(1);
  });
});
