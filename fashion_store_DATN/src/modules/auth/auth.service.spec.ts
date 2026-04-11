import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersService } from '@modules/user/services/user.service';
import { User } from '@modules/user/entities/user.entity';
import { Role } from './role.enum';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

  // Checklist compliance:
  // - Moi test case deu co comment Test Case ID ngay truoc it(...).
  // - CheckDB duoc the hien bang assert vao userRepo/usersService/cache (mock persistence).
  // - Rollback duoc thuc hien trong afterEach() tren object mock, khong dung DB that.

  // Cac mock ben duoi dong vai tro nhu tang luu tru/giao tiep ngoai,
  // giup unit test chi tap trung vao logic AuthService.
  const userRepo = {
    findOne: jest.fn<(...args: any[]) => Promise<User | null>>(),
    save: jest.fn<(...args: any[]) => Promise<User>>(),
    create: jest.fn<(...args: any[]) => User>(),
  };

  const usersService = {
    findOneByEmail: jest.fn<(...args: any[]) => Promise<User | null>>(),
  };

  const jwtService = {
    signAsync: jest.fn<(...args: any[]) => Promise<string>>(),
  };

  const mailerService = {
    sendMail: jest.fn<(...args: any[]) => Promise<void>>(),
  };

  const cacheManager = {
    set: jest.fn<(...args: any[]) => Promise<void>>(),
    get: jest.fn<(...args: any[]) => Promise<string | undefined>>(),
    del: jest.fn<(...args: any[]) => Promise<void>>(),
  };

  type UserDbSnapshot = Pick<
    User,
    | 'loginFailedCount'
    | 'lockUntil'
    | 'otpCode'
    | 'otpExpiresAt'
    | 'otpAttempts'
    | 'isVerified'
    | 'passwordHash'
  >;

  const usersNeedingRollback: Array<{ user: User; snapshot: UserDbSnapshot }> =
    [];

  // Luu snapshot cac truong co the bi mutate trong qua trinh test,
  // de co the rollback ve trang thai ban dau sau moi test case.
  const captureUserDbSnapshot = (user: User): UserDbSnapshot => ({
    loginFailedCount: user.loginFailedCount,
    lockUntil: user.lockUntil,
    otpCode: user.otpCode,
    otpExpiresAt: user.otpExpiresAt,
    otpAttempts: user.otpAttempts,
    isVerified: user.isVerified,
    passwordHash: user.passwordHash,
  });

  const registerRollbackSnapshot = (user: User) => {
    usersNeedingRollback.push({ user, snapshot: captureUserDbSnapshot(user) });
  };

  // Rollback tren object gia lap (mock entity),
  // khong tac dong den database that.
  const rollbackTrackedUsers = () => {
    for (const { user, snapshot } of usersNeedingRollback) {
      user.loginFailedCount = snapshot.loginFailedCount;
      user.lockUntil = snapshot.lockUntil;
      user.otpCode = snapshot.otpCode;
      user.otpExpiresAt = snapshot.otpExpiresAt;
      user.otpAttempts = snapshot.otpAttempts;
      user.isVerified = snapshot.isVerified;
      user.passwordHash = snapshot.passwordHash;
    }
    usersNeedingRollback.length = 0;
  };

  const buildMockUser = (overrides: Partial<User> = {}): User => {
    return {
      id: 1,
      name: 'Test User',
      email: 'user@example.com',
      phone: '0123456789',
      address: 'HN',
      avatarUrl: 'avatar.png',
      passwordHash: 'hashed-password',
      role: Role.USER,
      isVerified: true,
      loginFailedCount: 0,
      lockUntil: null,
      otpCode: '123456',
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      otpAttempts: 0,
      ...overrides,
    } as User;
  };

  beforeEach(async () => {
    // Lam sach lich su goi mock truoc moi test de dam bao doc lap.
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: MailerService,
          useValue: mailerService,
        },
        {
          provide: 'CACHE_MANAGER',
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    // Rollback: khoi phuc du lieu gia lap ve trang thai truoc khi test.
    rollbackTrackedUsers();
    jest.restoreAllMocks();
  });

  describe('signIn', () => {
    // Test Case ID: UT_AUTH_001
    it('throws UnauthorizedException when email does not exist', async () => {
      // Muc tieu: xac minh dang nhap that bai khi email khong ton tai.
      // Input: email khong co trong he thong.
      // Ky vong: nem UnauthorizedException.
      usersService.findOneByEmail.mockResolvedValue(null);

      await expect(
        service.signIn('none@example.com', '123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      // CheckDB (read): xac minh da truy van email dung tham so.
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        'none@example.com',
      );
    });

    // Test Case ID: UT_AUTH_002
    it('throws ForbiddenException when account is not verified', async () => {
      // Muc tieu: chan dang nhap voi tai khoan chua xac thuc.
      // Input: user ton tai nhung isVerified = false.
      // Ky vong: nem ForbiddenException.
      usersService.findOneByEmail.mockResolvedValue(
        buildMockUser({ isVerified: false }),
      );

      await expect(
        service.signIn('user@example.com', '123'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Test Case ID: UT_AUTH_003
    it('throws ForbiddenException when account is temporarily locked', async () => {
      // Muc tieu: chan dang nhap khi tai khoan dang bi khoa tam thoi.
      // Input: lockUntil > thoi diem hien tai.
      // Ky vong: nem ForbiddenException.
      usersService.findOneByEmail.mockResolvedValue(
        buildMockUser({ lockUntil: new Date(Date.now() + 60_000) }),
      );

      await expect(
        service.signIn('user@example.com', '123'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Test Case ID: UT_AUTH_004
    it('increments failed count and throws UnauthorizedException when password is wrong', async () => {
      // Chuan bi du lieu
      const user = buildMockUser({ loginFailedCount: 2 });
      registerRollbackSnapshot(user);
      usersService.findOneByEmail.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(false as never);

      // Thuc thi va kiem tra exception
      await expect(
        service.signIn('user@example.com', 'wrong'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      // CheckDB: xac minh du lieu thay doi dung va da goi ham luu.
      expect(user.loginFailedCount).toBe(3);
      expect(userRepo.save).toHaveBeenCalledWith(user);
    });

    // Test Case ID: UT_AUTH_005
    it('locks account after 5 failed attempts', async () => {
      // Chuan bi du lieu
      const user = buildMockUser({ loginFailedCount: 4 });
      registerRollbackSnapshot(user);
      usersService.findOneByEmail.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(false as never);

      // Thuc thi va kiem tra exception
      await expect(
        service.signIn('user@example.com', 'wrong'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      // CheckDB: xac minh lockUntil duoc set va da luu vao repository.
      expect(user.loginFailedCount).toBe(5);
      expect(user.lockUntil).toBeInstanceOf(Date);
      expect(userRepo.save).toHaveBeenCalledWith(user);
    });

    // Test Case ID: UT_AUTH_006
    it('returns access token and resets lock info when password is correct', async () => {
      // Chuan bi du lieu
      const user = buildMockUser({
        loginFailedCount: 4,
        lockUntil: new Date(),
      });
      registerRollbackSnapshot(user);
      usersService.findOneByEmail.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(true as never);
      jwtService.signAsync.mockResolvedValue('jwt-token');

      // Thuc thi
      const result = await service.signIn('user@example.com', 'correct');

      // Kiem tra ket qua va CheckDB
      expect(user.loginFailedCount).toBe(0);
      expect(user.lockUntil).toBeNull();
      expect(userRepo.save).toHaveBeenCalledWith(user);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        address: user.address,
        avatar: user.avatarUrl,
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        `userToken:${user.id}`,
        'jwt-token',
        {
          ttl: 60 * 60 * 24,
        },
      );
      expect(result).toEqual({ access_token: 'jwt-token' });
    });
  });

  describe('refresh', () => {
    // Test Case ID: UT_AUTH_007
    it('throws UnauthorizedException when refresh token is invalid', async () => {
      // Muc tieu: tu choi refresh token khong trung token da luu.
      // Input: token client gui len khac voi token trong cache.
      // Ky vong: nem UnauthorizedException.
      cacheManager.get.mockResolvedValue('saved-token');

      await expect(service.refresh(1, 'incoming-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    // Test Case ID: UT_AUTH_008
    it('returns new access token when refresh token is valid', async () => {
      // Muc tieu: cap access token moi khi refresh token hop le.
      // Input: refresh token hop le trong cache.
      // Ky vong: tra ve accessToken moi va goi jwtService.signAsync dung payload.
      cacheManager.get.mockResolvedValue('refresh-token');
      jwtService.signAsync.mockResolvedValue('new-access-token');

      const result = await service.refresh(1, 'refresh-token');

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 1 },
        { expiresIn: '15m' },
      );
      expect(result).toEqual({ accessToken: 'new-access-token' });
    });
  });

  describe('register', () => {
    // Test Case ID: UT_AUTH_009
    it('throws ConflictException when email or phone is missing', async () => {
      // Muc tieu: validate du lieu bat buoc cho dang ky.
      // Input: email/phone rong.
      // Ky vong: nem ConflictException.
      await expect(
        service.register({
          name: 'User',
          email: '',
          phone: '',
          address: 'HN',
          password: '123456',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Test Case ID: UT_AUTH_010
    it('throws ConflictException when email or phone already exists', async () => {
      // Muc tieu: ngan tao tai khoan trung email hoac so dien thoai.
      // Input: repository tra ve user da ton tai.
      // Ky vong: nem ConflictException.
      userRepo.findOne.mockResolvedValue(buildMockUser());

      await expect(
        service.register({
          name: 'User',
          email: 'user@example.com',
          phone: '0123456789',
          address: 'HN',
          password: '123456',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Test Case ID: UT_AUTH_011
    it('creates user with hashed password and sends OTP', async () => {
      // Chuan bi du lieu
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((input) => input);
      const savedUser = buildMockUser({ id: 10 });
      userRepo.save.mockResolvedValue(savedUser);
      bcryptMock.hash.mockResolvedValue('hashed-123' as never);
      const sendOtpSpy = jest.spyOn(service, 'sendOtp').mockResolvedValue();

      const dto = {
        name: 'User',
        email: 'user@example.com',
        phone: '0123456789',
        address: 'HN',
        password: '123456',
      };

      // Thuc thi
      const result = await service.register(dto);

      // Kiem tra ket qua va CheckDB
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          phone: dto.phone,
          passwordHash: 'hashed-123',
          role: Role.USER,
          isVerified: false,
        }),
      );
      expect(sendOtpSpy).toHaveBeenCalled();
      expect(result).toBe(savedUser);
    });
  });

  describe('sendOtp', () => {
    // Test Case ID: UT_AUTH_012
    it('updates OTP fields, persists user, and sends email', async () => {
      // Chuan bi du lieu
      const user = buildMockUser();
      registerRollbackSnapshot(user);
      userRepo.save.mockResolvedValue(user);
      mailerService.sendMail.mockResolvedValue(undefined);
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

      // Thuc thi
      await service.sendOtp(user);

      // Kiem tra ket qua va CheckDB
      expect(user.otpCode).toBe('100000');
      expect(user.otpAttempts).toBe(0);
      expect(user.otpExpiresAt).toBeInstanceOf(Date);
      expect(userRepo.save).toHaveBeenCalledWith(user);
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: expect.any(String),
        }),
      );

      randomSpy.mockRestore();
    });
  });

  describe('verifyOtp', () => {
    // Test Case ID: UT_AUTH_013
    it('throws NotFoundException when user is not found', async () => {
      // Muc tieu: kiem tra xu ly khi email khong tim thay user.
      // Input: findOne tra ve null.
      // Ky vong: nem NotFoundException.
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.verifyOtp('none@example.com', '123456'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Test Case ID: UT_AUTH_014
    it('throws BadRequestException when OTP is expired', async () => {
      // Muc tieu: tu choi OTP da het han.
      // Input: otpExpiresAt nho hon thoi diem hien tai.
      // Ky vong: nem BadRequestException.
      const user = buildMockUser({
        otpExpiresAt: new Date(Date.now() - 60_000),
      });
      registerRollbackSnapshot(user);
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.verifyOtp(user.email, '123456'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    // Test Case ID: UT_AUTH_015
    it('throws ForbiddenException when OTP attempts reached limit', async () => {
      // Muc tieu: khoa OTP sau so lan sai toi da.
      // Input: otpAttempts = 5.
      // Ky vong: nem ForbiddenException.
      const user = buildMockUser({ otpAttempts: 5 });
      registerRollbackSnapshot(user);
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.verifyOtp(user.email, '123456'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Test Case ID: UT_AUTH_016
    it('increments OTP attempts and throws BadRequestException when OTP is wrong', async () => {
      // Muc tieu: tang so lan thu OTP khi nhap sai ma.
      // Input: OTP nguoi dung nhap khac otpCode hien tai.
      // Ky vong: otpAttempts tang 1, save duoc goi, va nem BadRequestException.
      const user = buildMockUser({ otpCode: '111111', otpAttempts: 1 });
      registerRollbackSnapshot(user);
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.verifyOtp(user.email, '222222'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(user.otpAttempts).toBe(2);
      expect(userRepo.save).toHaveBeenCalledWith(user);
    });

    // Test Case ID: UT_AUTH_017
    it('verifies account and clears OTP data when OTP is correct', async () => {
      // Chuan bi du lieu
      const user = buildMockUser({ otpCode: '123456' });
      registerRollbackSnapshot(user);
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      // Thuc thi
      const result = await service.verifyOtp(user.email, '123456');

      // Kiem tra ket qua va CheckDB
      expect(user.isVerified).toBe(true);
      expect(user.otpCode).toBeNull();
      expect(user.otpExpiresAt).toBeNull();
      expect(user.otpAttempts).toBe(0);
      expect(userRepo.save).toHaveBeenCalledWith(user);
      expect(result).toEqual({ message: expect.any(String) });
    });
  });

  describe('forgotPassword', () => {
    // Test Case ID: UT_AUTH_018
    it('throws NotFoundException when email is not found', async () => {
      // Muc tieu: khong gui OTP reset cho email khong ton tai.
      // Input: findOne theo email tra ve null.
      // Ky vong: nem NotFoundException.
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'none@example.com' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Test Case ID: UT_AUTH_019
    it('sends OTP and returns success message when email exists', async () => {
      // Muc tieu: gui OTP reset khi email hop le.
      // Input: user ton tai theo email.
      // Ky vong: sendOtp duoc goi va tra ve thong diep thanh cong.
      const user = buildMockUser();
      userRepo.findOne.mockResolvedValue(user);
      const sendOtpSpy = jest.spyOn(service, 'sendOtp').mockResolvedValue();

      const result = await service.forgotPassword({ email: user.email });

      expect(sendOtpSpy).toHaveBeenCalledWith(user);
      expect(result).toEqual({ message: expect.any(String) });
    });
  });

  describe('resetPassword', () => {
    // Test Case ID: UT_AUTH_020
    it('verifies OTP, updates password hash, and saves user', async () => {
      // Chuan bi du lieu
      const user = buildMockUser();
      registerRollbackSnapshot(user);
      const verifyOtpSpy = jest.spyOn(service, 'verifyOtp').mockResolvedValue({
        message: 'ok',
      });
      userRepo.findOne.mockResolvedValue(user);
      bcryptMock.hash.mockResolvedValue('new-hash' as never);
      userRepo.save.mockResolvedValue(user);

      // Thuc thi
      const result = await service.resetPassword({
        email: user.email,
        otp: '123456',
        newPassword: 'new-password',
      });

      // Kiem tra ket qua va CheckDB
      expect(verifyOtpSpy).toHaveBeenCalledWith(user.email, '123456');
      expect(user.passwordHash).toBe('new-hash');
      expect(userRepo.save).toHaveBeenCalledWith(user);
      expect(result).toEqual({ message: expect.any(String) });
    });
  });

  describe('logout', () => {
    // Test Case ID: UT_AUTH_021
    it('deletes refresh token from cache and returns success message', async () => {
      // Muc tieu: xoa refresh token trong cache khi logout.
      // Input: userId da dang nhap.
      // Ky vong: goi cacheManager.del voi key refresh:<userId> va tra thong diep.
      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.logout(5);

      expect(cacheManager.del).toHaveBeenCalledWith('refresh:5');
      expect(result).toEqual({ message: expect.any(String) });
    });
  });
});
