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
    // reset implementation để tránh leak mockResolvedValue giữa các test
    jest.resetAllMocks();

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
    // Test Case ID: TC_AUTH_SERVICE_001
    it('[TC_AUTH_SERVICE_001] ném UnauthorizedException khi email không tồn tại trong hệ thống', async () => {
      const email = 'none@example.com';
      const password = '123';

      usersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.signIn(email, password)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      // CheckDB (READ verification)
      expect(usersService.findOneByEmail).toHaveBeenCalledTimes(1);
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(email);
    });
    // Test Case ID: TC_AUTH_SERVICE_002
    it('[TC_AUTH_SERVICE_002] ném ForbiddenException khi tài khoản chưa được xác thực (isVerified = false)', async () => {
      const email = 'user@example.com';
      const password = '123';

      const mockUser = buildMockUser({
        isVerified: false,
      });

      usersService.findOneByEmail.mockResolvedValue(mockUser);

      await expect(service.signIn(email, password)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      // CheckDB (READ verification)
      expect(usersService.findOneByEmail).toHaveBeenCalledTimes(1);
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(email);
    });
    // Test Case ID: TC_AUTH_SERVICE_003
    it('[TC_AUTH_SERVICE_003] ném ForbiddenException khi tài khoản đang bị khóa tạm thời (lockUntil > now)', async () => {
      const email = 'user@example.com';
      const password = '123';

      const lockedUser = buildMockUser({
        lockUntil: new Date(Date.now() + 60_000), // khóa trong tương lai
      });

      usersService.findOneByEmail.mockResolvedValue(lockedUser);

      await expect(service.signIn(email, password)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      // CheckDB (READ verification)
      expect(usersService.findOneByEmail).toHaveBeenCalledTimes(1);
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(email);
    });

    // Test Case ID: TC_AUTH_SERVICE_004
    it('[TC_AUTH_SERVICE_004] tăng loginFailedCount và ném UnauthorizedException khi mật khẩu sai', async () => {
      const email = 'user@example.com';
      const wrongPassword = 'wrong';

      const user = buildMockUser({
        email,
        loginFailedCount: 2,
      });

      usersService.findOneByEmail.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.signIn(email, wrongPassword)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      // Check business logic state change
      expect(user.loginFailedCount).toBe(3);

      // CheckDB (WRITE verification)
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          loginFailedCount: 3,
        }),
      );
    });

    // Test Case ID: TC_AUTH_SERVICE_005
    it('[TC_AUTH_SERVICE_005] khóa tài khoản khi đăng nhập sai đạt 5 lần thất bại liên tiếp', async () => {
      const email = 'user@example.com';
      const wrongPassword = 'wrong';

      const user = buildMockUser({
        email,
        loginFailedCount: 4,
        lockUntil: null,
      });

      usersService.findOneByEmail.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(false as never);

      await expect(service.signIn(email, wrongPassword)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      // Check business state change
      expect(user.loginFailedCount).toBe(5);
      expect(user.lockUntil).toBeInstanceOf(Date);

      // lockUntil phải nằm trong tương lai (account bị khóa)
      expect((user.lockUntil as Date).getTime()).toBeGreaterThan(Date.now());

      // CheckDB (WRITE verification)
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          loginFailedCount: 5,
          lockUntil: expect.any(Date),
        }),
      );
    });

    // Test Case ID: TC_AUTH_SERVICE_006
    it('[TC_AUTH_SERVICE_006] trả về access token và reset trạng thái lock khi đăng nhập thành công', async () => {
      const email = 'user@example.com';
      const password = 'correct';

      const user = buildMockUser({
        email,
        loginFailedCount: 4,
        lockUntil: new Date(), // đang bị khóa nhưng mật khẩu đúng → reset
      });

      usersService.findOneByEmail.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(true as never);
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.signIn(email, password);

      // Check business state reset
      expect(user.loginFailedCount).toBe(0);
      expect(user.lockUntil).toBeNull();

      // CheckDB (WRITE verification)
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          loginFailedCount: 0,
          lockUntil: null,
        }),
      );

      // JWT generation validation (less brittle)
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: user.id,
          email: user.email,
          role: user.role,
        }),
      );

      // Cache validation
      expect(cacheManager.set).toHaveBeenCalledWith(
        `userToken:${user.id}`,
        'jwt-token',
        { ttl: 60 * 60 * 24 },
      );

      // Response validation
      expect(result).toEqual({ access_token: 'jwt-token' });
    });
    it('[TC_AUTH_SERVICE_007] ném UnauthorizedException khi password bị thiếu hoặc rỗng', async () => {
      const email = 'user@example.com';

      usersService.findOneByEmail.mockResolvedValue(buildMockUser());

      await expect(service.signIn(email, '' as any)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      // CheckDB (READ verification)
      expect(usersService.findOneByEmail).toHaveBeenCalledTimes(0);

      // Security flow
      expect(bcryptMock.compare).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    // Test Case ID: TC_AUTH_SERVICE_008
    it('[TC_AUTH_SERVICE_008] ném UnauthorizedException khi refresh token không hợp lệ (không khớp cache)', async () => {
      const userId = 1;
      const incomingToken = 'incoming-token';

      cacheManager.get.mockResolvedValue('saved-token');

      await expect(
        service.refresh(userId, incomingToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      // CheckDB (READ verification)
      expect(cacheManager.get).toHaveBeenCalledTimes(1);
      expect(cacheManager.get).toHaveBeenCalledWith(`refresh:${userId}`);

      // Security flow validation
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    // Test Case ID: TC_AUTH_SERVICE_009
    it('[TC_AUTH_SERVICE_009] trả về access token mới khi refresh token hợp lệ', async () => {
      const userId = 1;
      const refreshToken = 'refresh-token';

      cacheManager.get.mockResolvedValue(refreshToken);
      jwtService.signAsync.mockResolvedValue('new-access-token');

      const result = await service.refresh(userId, refreshToken);

      // CheckDB (READ verification)
      expect(cacheManager.get).toHaveBeenCalledTimes(1);
      expect(cacheManager.get).toHaveBeenCalledWith(`refresh:${userId}`);

      // JWT contract validation (less brittle)
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
        }),
        expect.objectContaining({
          expiresIn: '15m',
        }),
      );

      // Response validation
      expect(result).toEqual({ accessToken: 'new-access-token' });
    });
  });

  describe('register', () => {
    // Test Case ID: TC_AUTH_SERVICE_010
    it('[TC_010] ném ConflictException khi email bị rỗng', async () => {
      const registerDto = {
        name: 'User',
        email: '',
        phone: '0123456789',
        address: 'HN',
        password: '123456',
      };

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );

      // Không được gọi DB
      expect(usersService.findOneByEmail).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });
    // Test Case ID: TC_AUTH_SERVICE_011
    it('[TC_011] ném ConflictException khi phone bị rỗng', async () => {
      const registerDto = {
        name: 'User',
        email: 'user@example.com',
        phone: '',
        address: 'HN',
        password: '123456',
      };

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(usersService.findOneByEmail).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    // Test Case ID: TC_AUTH_SERVICE_012
    it('[TC_012] ném ConflictException khi email đã tồn tại', async () => {
      const registerDto = {
        name: 'User',
        email: 'user@example.com',
        phone: '0123456789',
        address: 'HN',
        password: '123456',
      };

      // Mock: email hoặc phone đã tồn tại
      userRepo.findOne.mockResolvedValue(
        buildMockUser({ email: registerDto.email }),
      );

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );

      // CheckDB (READ verification)
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: [{ email: registerDto.email }, { phone: registerDto.phone }],
      });

      // Không được tạo user mới
      expect(userRepo.save).not.toHaveBeenCalled();
      expect(bcryptMock.hash).not.toHaveBeenCalled();
    });
    // Test Case ID: TC_AUTH_SERVICE_013
    it('[TC_013] ném ConflictException khi phone đã tồn tại', async () => {
      const registerDto = {
        name: 'User',
        email: 'user@example.com',
        phone: '0123456789',
        address: 'HN',
        password: '123456',
      };

      // Phone đã tồn tại
      userRepo.findOne.mockResolvedValue(
        buildMockUser({ phone: registerDto.phone }),
      );

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );

      // CheckDB (READ verification)
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: [{ email: registerDto.email }, { phone: registerDto.phone }],
      });

      // Không được tạo user mới
      expect(userRepo.save).not.toHaveBeenCalled();
      expect(bcryptMock.hash).not.toHaveBeenCalled();
    });

    // Test Case ID: TC_AUTH_SERVICE_014
    it('[TC_014] tạo user với password đã hash và gửi OTP thành công', async () => {
      const dto = {
        name: 'User',
        email: 'user@example.com',
        phone: '0123456789',
        address: 'HN',
        password: '123456',
      };

      const hashedPassword = 'hashed-123';

      // Mock DB & dependencies
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((input) => input);

      const savedUser = buildMockUser({ id: 10 });
      userRepo.save.mockResolvedValue(savedUser);

      bcryptMock.hash.mockResolvedValue(hashedPassword as never);

      const sendOtpSpy = jest
        .spyOn(service, 'sendOtp')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.register(dto);

      // PASSWORD HASH VALIDATION
      expect(bcryptMock.hash).toHaveBeenCalledWith(
        dto.password,
        expect.any(Number),
      );

      // ENTITY CREATION VALIDATION
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          phone: dto.phone,
          passwordHash: hashedPassword,
          role: Role.USER,
          isVerified: false,
        }),
      );

      // đảm bảo không lưu password raw
      const createArg = userRepo.create.mock.calls[0][0];
      expect(createArg.password).toBeUndefined();

      // DB WRITE VALIDATION
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
        }),
      );

      // OTP FLOW VALIDATION
      expect(sendOtpSpy).toHaveBeenCalledTimes(1);
      expect(sendOtpSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          phone: dto.phone,
        }),
      );

      // RESPONSE VALIDATION
      expect(result).toEqual(savedUser);
    });
  });

  describe('sendOtp', () => {
    // Test Case ID: TC_AUTH_SERVICE_015
    it('[TC_015] cập nhật OTP, lưu DB và gửi email đúng thông tin', async () => {
      // Arrange
      const user = buildMockUser({ email: 'user@example.com' });

      userRepo.save.mockResolvedValue(user);
      mailerService.sendMail.mockResolvedValue(undefined);

      // fix random để OTP predictable
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

      // fix time để assert expiration không bị flaky
      const fixedNow = 1_700_000_000_000;
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

      // Act
      await service.sendOtp(user);

      // OTP VALUE VALIDATION
      expect(user.otpCode).toMatch(/^\d{6}$/); // luôn là 6 chữ số
      expect(user.otpCode).toBe('100000'); // với random = 0

      expect(user.otpAttempts).toBe(0);

      // OTP EXPIRATION VALIDATION
      expect(user.otpExpiresAt).toBeInstanceOf(Date);

      // phải nằm trong tương lai
      expect(user.otpExpiresAt!.getTime()).toBeGreaterThan(fixedNow);
      expect(user.otpExpiresAt!.getTime()).toBeLessThanOrEqual(
        fixedNow + 5 * 60 * 1000,
      );

      // DB WRITE VALIDATION
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(user);

      // EMAIL VALIDATION
      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: expect.any(String),
          // đảm bảo nội dung mail có OTP
          html: expect.stringContaining(user.otpCode),
        }),
      );
      // CLEANUP
      randomSpy.mockRestore();
      nowSpy.mockRestore();
    });
  });
  describe('verifyOtp', () => {
    // Test Case ID: TC_AUTH_SERVICE_016
    it('[TC_016] ném NotFoundException khi không tìm thấy user theo email', async () => {
      const email = 'none@example.com';
      const otp = '123456';

      // Mock DB: không tìm thấy user
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyOtp(email, otp)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      // CheckDB (READ verification)
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email },
      });

      // Đảm bảo không xử lý thêm
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    // Test Case ID: TC_AUTH_SERVICE_017
    it('[TC_017] ném BadRequestException khi OTP đã hết hạn', async () => {
      const email = 'user@example.com';
      const otp = '123456';

      const expiredDate = new Date(Date.now() - 60_000); // đã hết hạn

      const user = buildMockUser({
        email,
        otpCode: otp,
        otpExpiresAt: expiredDate,
      });

      userRepo.findOne.mockResolvedValue(user);

      const now = Date.now();

      await expect(service.verifyOtp(email, otp)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      // CheckDB (READ verification)
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email },
      });

      // Xác thực logic hết hạn OTP
      expect(user.otpExpiresAt).toBeInstanceOf(Date);
      expect(user.otpExpiresAt!.getTime()).toBeLessThan(now);

      expect(userRepo.save).not.toHaveBeenCalled();
    });

    // Test Case ID: TC_AUTH_SERVICE_018
    it('[TC_018] ném ForbiddenException khi số lần nhập OTP vượt giới hạn cho phép', async () => {
      const email = 'user@example.com';
      const otp = '123456';

      const user = buildMockUser({
        email,
        otpCode: '654321', // OTP thật
        otpAttempts: 5,
        otpExpiresAt: new Date(Date.now() + 60_000),
      });

      userRepo.findOne.mockResolvedValue(user);

      await expect(service.verifyOtp(email, otp)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      // CheckDB (READ verification)
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email },
      });

      // Ensure no further processing
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    // Test Case ID: TC_AUTH_SERVICE_019
    it('[TC_019] tăng otpAttempts và ném BadRequestException khi OTP nhập sai', async () => {
      const email = 'user@example.com';
      const wrongOtp = '222222';

      const user = buildMockUser({
        email,
        otpCode: '111111', // OTP đúng
        otpAttempts: 1, // trước đó đã thử 1 lần
        otpExpiresAt: new Date(Date.now() + 60_000), // còn hạn
      });

      userRepo.findOne.mockResolvedValue(user);

      await expect(service.verifyOtp(email, wrongOtp)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      // CheckDB (READ verification)
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email },
      });

      // Business logic validation
      expect(user.otpAttempts).toBe(2); // tăng đúng 1

      // không được thay đổi OTP gốc
      expect(user.otpCode).toBe('111111');

      // DB WRITE validation
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          otpAttempts: 2,
        }),
      );
    });

    // Test Case ID: TC_AUTH_SERVICE_020
    it('[TC_020] xác thực thành công khi OTP đúng và reset toàn bộ trạng thái OTP', async () => {
      const email = 'user@example.com';
      const otp = '123456';

      const user = buildMockUser({
        email,
        otpCode: otp,
        otpAttempts: 2,
        otpExpiresAt: new Date(Date.now() + 60_000), // còn hạn
        isVerified: false,
      });

      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      const result = await service.verifyOtp(email, otp);

      // CheckDB (READ verification)
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email },
      });

      // Business state validation
      expect(user.isVerified).toBe(true);

      // OTP phải được clear hoàn toàn
      expect(user.otpCode).toBeNull();
      expect(user.otpExpiresAt).toBeNull();

      // reset số lần thử
      expect(user.otpAttempts).toBe(0);

      // DB WRITE validation
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          isVerified: true,
          otpCode: null,
          otpExpiresAt: null,
          otpAttempts: 0,
        }),
      );

      // Response validation
      expect(result).toEqual({
        message: expect.any(String),
      });
    });
  });

  describe('forgotPassword', () => {
    // Test Case ID: TC_AUTH_SERVICE_021
    it('[TC_021] ném NotFoundException khi không tìm thấy email trong forgotPassword', async () => {
      const email = 'none@example.com';

      // Mock DB: không tìm thấy user
      userRepo.findOne.mockResolvedValue(null);

      const sendOtpSpy = jest.spyOn(service, 'sendOtp');

      await expect(service.forgotPassword({ email })).rejects.toBeInstanceOf(
        NotFoundException,
      );

      // CheckDB (READ verification)
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email },
      });

      // Ensure no further processing
      expect(sendOtpSpy).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    // Test Case ID: TC_AUTH_SERVICE_022
    it('[TC_022] gửi OTP và trả về thông báo thành công khi email tồn tại', async () => {
      const email = 'user@example.com';

      const user = buildMockUser({ email });

      userRepo.findOne.mockResolvedValue(user);

      const sendOtpSpy = jest
        .spyOn(service, 'sendOtp')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.forgotPassword({ email });

      // CheckDB (READ verification)
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email },
      });

      // Business flow validation
      expect(sendOtpSpy).toHaveBeenCalledTimes(1);
      expect(sendOtpSpy).toHaveBeenCalledWith(user);

      // Ensure no unintended DB write here
      // (OTP update nằm trong sendOtp, không phải forgotPassword)
      expect(userRepo.save).not.toHaveBeenCalled();

      // Response validation
      expect(result).toEqual({
        message: expect.stringContaining('OTP'),
      });
    });
  });

  describe('resetPassword', () => {
    // Test Case ID: TC_AUTH_SERVICE_023
    it('[TC_023] xác thực OTP, cập nhật password hash và lưu user khi resetPassword thành công', async () => {
      const email = 'user@example.com';
      const otp = '123456';
      const newPassword = 'new-password';

      const user = buildMockUser({
        email,
        passwordHash: 'old-hash',
      });

      userRepo.findOne.mockResolvedValue(user);

      const verifyOtpSpy = jest
        .spyOn(service, 'verifyOtp')
        .mockResolvedValue({ message: 'ok' });

      bcryptMock.hash.mockResolvedValue('new-hash' as never);
      userRepo.save.mockResolvedValue(user);

      // Act
      const result = await service.resetPassword({
        email,
        otp,
        newPassword,
      });

      // CheckDB (READ verification)
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email },
      });

      // Flow validation
      expect(verifyOtpSpy).toHaveBeenCalledTimes(1);
      expect(verifyOtpSpy).toHaveBeenCalledWith(email, otp);

      expect(bcryptMock.hash).toHaveBeenCalledTimes(1);
      expect(bcryptMock.hash).toHaveBeenCalledWith(
        newPassword,
        expect.any(Number),
      );

      // Business state change
      expect(user.passwordHash).toBe('new-hash');
      expect(user.passwordHash).not.toBe('old-hash');

      // DB WRITE validation
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          passwordHash: 'new-hash',
        }),
      );

      // Response validation
      expect(result).toEqual({
        message: expect.any(String),
      });
    });
  });

  describe('logout', () => {
    // Test Case ID: TC_AUTH_SERVICE_024
    it('[TC_024] xóa refresh token trong cache và trả về thông báo logout thành công', async () => {
      const userId = 5;

      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.logout(userId);

      // Cache interaction validation
      expect(cacheManager.del).toHaveBeenCalledTimes(1);
      expect(cacheManager.del).toHaveBeenCalledWith(`refresh:${userId}`);

      // Ensure no unintended side-effects
      expect(userRepo.save).not.toHaveBeenCalled();

      // Response validation
      expect(result).toEqual({
        message: expect.stringContaining('Logout'),
      });
    });
  });
});
