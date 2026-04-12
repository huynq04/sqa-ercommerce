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
  it('goi authService.signIn voi email/password tu DTO', async () => {
    // Muc tieu: dam bao endpoint login truyen dung email/password xuong AuthService.
    // Input: DTO gom email va password.
    // Ky vong: AuthService.signIn duoc goi dung tham so va tra ve access token.
    // Chuan bi du lieu
    const loginDto = { email: 'user@example.com', password: 'secret' };
    authServiceMock.signIn.mockResolvedValue({ access_token: 'jwt-token' });

    // Thuc thi
    const result = await controller.signIn(loginDto);

    // Kiem tra ket qua + CheckDB (gian tiep qua service layer)
    expect(authServiceMock.signIn).toHaveBeenCalledWith(
      loginDto.email,
      loginDto.password,
    );
    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  // Test Case ID: TC_AUTH_CTRL_002
  it('goi authService.register voi register DTO', async () => {
    // Muc tieu: xac minh endpoint register pass-through DTO xuong service.
    // Input: registerDto day du thong tin.
    // Ky vong: service nhan dung DTO va controller tra ket qua tao user.
    const registerDto = {
      name: 'User A',
      email: 'a@example.com',
      password: '123456',
      phone: '0123456789',
      address: 'HN',
    };
    authServiceMock.register.mockResolvedValue({ id: 10, ...registerDto });

    const result = await controller.register(registerDto);

    expect(authServiceMock.register).toHaveBeenCalledWith(registerDto);
    expect(result).toEqual({ id: 10, ...registerDto });
  });

  // Test Case ID: TC_AUTH_CTRL_003
  it('goi authService.verifyOtp voi email va otp tu DTO', async () => {
    // Muc tieu: kiem tra mapping email/otp tu body vao service verifyOtp.
    // Input: verifyOtpDto (email, otp).
    // Ky vong: service duoc goi dung 2 tham so va tra thong diep thanh cong.
    const verifyOtpDto = { email: 'a@example.com', otp: '123456' };
    authServiceMock.verifyOtp.mockResolvedValue({
      message: 'Xác nhận thành công',
    });

    const result = await controller.verify(verifyOtpDto);

    expect(authServiceMock.verifyOtp).toHaveBeenCalledWith(
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );
    expect(result).toEqual({ message: 'Xác nhận thành công' });
  });

  // Test Case ID: TC_AUTH_CTRL_004
  it('goi authService.forgotPassword voi forgot DTO', async () => {
    // Muc tieu: dam bao endpoint forgot-password goi dung service method.
    // Input: forgotPasswordDto chi gom email.
    // Ky vong: service nhan dto va ket qua duoc tra nguyen ven.
    const forgotPasswordDto = { email: 'a@example.com' };
    authServiceMock.forgotPassword.mockResolvedValue({
      message: 'OTP reset máº­t kháº©u Ä‘Ã£ gá»­i',
    });

    const result = await controller.forgot(forgotPasswordDto);

    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith(
      forgotPasswordDto,
    );
    expect(result).toEqual({ message: 'OTP reset máº­t kháº©u Ä‘Ã£ gá»­i' });
  });

  // Test Case ID: TC_AUTH_CTRL_005
  it('goi authService.resetPassword voi reset DTO', async () => {
    // Muc tieu: dam bao endpoint reset-password truyen dung payload xuong service.
    // Input: resetPasswordDto (email, otp, newPassword).
    // Ky vong: service duoc goi 1 lan voi dto va tra thong diep doi mat khau.
    const resetPasswordDto = {
      email: 'a@example.com',
      otp: '123456',
      newPassword: 'new-password',
    };
    authServiceMock.resetPassword.mockResolvedValue({
      message: 'Äá»•i máº­t kháº©u thÃ nh cÃ´ng',
    });

    const result = await controller.reset(resetPasswordDto);

    expect(authServiceMock.resetPassword).toHaveBeenCalledWith(
      resetPasswordDto,
    );
    expect(result).toEqual({ message: 'Äá»•i máº­t kháº©u thÃ nh cÃ´ng' });
  });

  // Test Case ID: TC_AUTH_CTRL_006
  it('goi authService.refresh voi userId va refreshToken tu req.user', async () => {
    // Muc tieu: xac minh controller lay sub/refreshToken tu req.user dung quy uoc.
    // Input: request co req.user.sub va req.user.refreshToken.
    // Ky vong: authService.refresh(userId, token) duoc goi dung thu tu tham so.
    const mockRequest = { user: { sub: 7, refreshToken: 'refresh-token' } };
    authServiceMock.refresh.mockResolvedValue({
      accessToken: 'new-access-token',
    });

    const result = await controller.refresh(mockRequest);

    expect(authServiceMock.refresh).toHaveBeenCalledWith(7, 'refresh-token');
    expect(result).toEqual({ accessToken: 'new-access-token' });
  });

  // Test Case ID: TC_AUTH_CTRL_007
  it('goi authService.logout voi userId tu req.user', async () => {
    // Muc tieu: dam bao logout endpoint forward dung userId da xac thuc.
    // Input: request co req.user.sub.
    // Ky vong: service.logout(sub) duoc goi va tra thong diep logout.
    const mockRequest = { user: { sub: 7 } };
    authServiceMock.logout.mockResolvedValue({
      message: 'Logout thÃ nh cÃ´ng',
    });

    const result = await controller.logout(mockRequest);

    expect(authServiceMock.logout).toHaveBeenCalledWith(7);
    expect(result).toEqual({ message: 'Logout thÃ nh cÃ´ng' });
  });

  // Test Case ID: TC_AUTH_CTRL_008
  it('tra ve req.user cho endpoint profile', () => {
    // Muc tieu: endpoint profile tra lai thong tin user da duoc guard gan vao request.
    // Input: request co truong user.
    // Ky vong: gia tri tra ve chinh la req.user.
    const mockRequest = { user: { sub: 1, email: 'profile@example.com' } };

    const result = controller.getProfile(mockRequest);

    expect(result).toEqual(mockRequest.user);
  });

  // Test Case ID: TC_AUTH_CTRL_009
  it('tra ve thong bao khi khong co user sinh nhat hom nay', async () => {
    // Muc tieu: xac minh nhanh branch khong co du lieu sinh nhat.
    // Input: usersService tra ve mang rong.
    // Ky vong:
    // - Controller tra thong bao khong co user.
    // - Khong goi mailerService.sendMail.
    // - Co goi usersService.findUsersWithBirthday de truy van du lieu.
    usersServiceMock.findUsersWithBirthday.mockResolvedValue([]);

    const result = await controller.sendBirthdayMail();

    // CheckDB: xac minh controller truy van usersService dung 1 lan.
    expect(usersServiceMock.findUsersWithBirthday).toHaveBeenCalledTimes(1);
    expect(mailerServiceMock.sendMail).not.toHaveBeenCalled();
    expect(result).toBe('Không có user sinh nhật hôm nay');
  });

  // Test Case ID: TC_AUTH_CTRL_010
  it('gui email cho tung user sinh nhat va tra ve tong so da gui', async () => {
    // Muc tieu: xac minh branch co du lieu sinh nhat.
    // Input: usersService tra ve danh sach 2 user.
    // Ky vong:
    // - Goi sendMail dung so lan user tim duoc.
    // - Moi lan goi co to/email dung.
    // - Controller tra chuoi tong ket dung so luong.
    const birthdayUsers = [
      { email: 'u1@example.com', name: 'User 1' },
      { email: 'u2@example.com', name: 'User 2' },
    ];
    usersServiceMock.findUsersWithBirthday.mockResolvedValue(birthdayUsers);
    mailerServiceMock.sendMail.mockResolvedValue(undefined);

    const result = await controller.sendBirthdayMail();

    // CheckDB: xac minh co lay danh sach user tu service.
    expect(usersServiceMock.findUsersWithBirthday).toHaveBeenCalledTimes(1);
    // Kiem tra so lan gui mail trung voi so user tim duoc.
    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(2);
    expect(mailerServiceMock.sendMail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: 'u1@example.com',
        subject: 'Chúc mừng sinh nhật 🎉',
      }),
    );
    expect(mailerServiceMock.sendMail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: 'u2@example.com',
        subject: 'Chúc mừng sinh nhật 🎉',
      }),
    );
    expect(result).toBe('2 người dùng đã được chúc mừng sinh nhật.');
  });

  // Test Case ID: TC_AUTH_CTRL_011
  it('cron job se log va goi sendBirthdayMail', async () => {
    // Muc tieu: xac minh cron method khong bo qua logic gui mail.
    // Input: goi truc tiep sendBirthdayMailCron.
    // Ky vong:
    // - Co log thong bao cron da chay.
    // - sendBirthdayMail duoc goi dung 1 lan.
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    const sendBirthdayMailSpy = jest
      .spyOn(controller, 'sendBirthdayMail')
      .mockResolvedValue('done');

    await controller.sendBirthdayMailCron();

    expect(logSpy).toHaveBeenCalledWith(
      'Cron job gửi email sinh nhật chạy lúc 10:00 sáng',
    );
    expect(sendBirthdayMailSpy).toHaveBeenCalledTimes(1);
  });
});
