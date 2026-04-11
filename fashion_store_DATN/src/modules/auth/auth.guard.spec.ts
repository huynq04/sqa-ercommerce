import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { AuthGuard } from './auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  // Mock cac dependency ngoai de unit test chi tap trung vao logic guard.
  const cacheManagerMock = {
    get: jest.fn<(...args: any[]) => Promise<string | undefined>>(),
  };

  const jwtServiceMock = {
    verifyAsync: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const reflectorMock = {
    getAllAndOverride: jest.fn<(...args: any[]) => boolean | undefined>(),
  };

  // Helper tao ExecutionContext gia lap cho cac testcase HTTP.
  const createExecutionContext = (authorization?: string) => {
    const request: Record<string, any> = {
      headers: {
        authorization,
      },
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    return {
      context: context as any,
      request,
    };
  };

  beforeEach(async () => {
    // Lam sach lich su mock truoc moi test case.
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: 'CACHE_MANAGER',
          useValue: cacheManagerMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: Reflector,
          useValue: reflectorMock,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test Case ID: UT_AUTH_GUARD_001
  it('cho phep truy cap ngay neu route duoc danh dau Public', async () => {
    // Muc tieu: khi metadata isPublic = true thi guard bo qua xac thuc token.
    reflectorMock.getAllAndOverride.mockReturnValue(true);
    const { context } = createExecutionContext();

    const result = await guard.canActivate(context);

    expect(reflectorMock.getAllAndOverride).toHaveBeenCalledWith(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    expect(result).toBe(true);
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
    expect(cacheManagerMock.get).not.toHaveBeenCalled();
  });

  // Test Case ID: UT_AUTH_GUARD_002
  it('nem UnauthorizedException khi khong co Authorization header', async () => {
    // Muc tieu: tu choi request khong gui token.
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const { context } = createExecutionContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  // Test Case ID: UT_AUTH_GUARD_003
  it('nem UnauthorizedException khi Authorization header khong dung Bearer format', async () => {
    // Input: header su dung type khac Bearer.
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const { context } = createExecutionContext('Basic abc-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  // Test Case ID: UT_AUTH_GUARD_004
  it('nem UnauthorizedException khi verify token that bai', async () => {
    // Muc tieu: bat loi token sai chu ky/het han.
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const { context } = createExecutionContext('Bearer jwt-token');
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('jwt invalid'));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith(
      'jwt-token',
      expect.objectContaining({ secret: expect.any(String) }),
    );
  });

  // Test Case ID: UT_AUTH_GUARD_005
  it('nem UnauthorizedException khi token khong con trong cache (bi thu hoi/het han)', async () => {
    // CheckDB: xac minh guard co kiem tra token trong CACHE_MANAGER theo key userToken:<sub>.
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const { context } = createExecutionContext('Bearer jwt-token');
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 7,
      email: 'u@example.com',
    });
    cacheManagerMock.get.mockResolvedValue(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(cacheManagerMock.get).toHaveBeenCalledWith('userToken:7');
  });

  // Test Case ID: UT_AUTH_GUARD_006
  it('nem UnauthorizedException khi token trong cache khac token request', async () => {
    // Muc tieu: phat hien token da bi thay doi/thu hoi khi so sanh voi cache.
    // Input: token request la jwt-token, token trong cache la another-token.
    // Ky vong: nem UnauthorizedException va khong cho phep truy cap.
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const { context } = createExecutionContext('Bearer jwt-token');
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 7,
      email: 'u@example.com',
    });
    cacheManagerMock.get.mockResolvedValue('another-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(cacheManagerMock.get).toHaveBeenCalledWith('userToken:7');
  });

  // Test Case ID: UT_AUTH_GUARD_007
  it('tra ve true va gan payload vao request.user khi token hop le', async () => {
    // Muc tieu: xac minh luong xac thuc thanh cong.
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const { context, request } = createExecutionContext('Bearer jwt-token');
    const payload = { sub: 9, email: 'ok@example.com', role: 'user' };
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);
    cacheManagerMock.get.mockResolvedValue('jwt-token');

    const result = await guard.canActivate(context);

    // CheckDB: co doi chieu token trong cache theo user id.
    expect(cacheManagerMock.get).toHaveBeenCalledWith('userToken:9');
    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
  });

  // Test Case ID: UT_AUTH_GUARD_008
  it('extractTokenFromHeader tra ve token khi header dung dinh dang Bearer', () => {
    // Test private method qua ep kieu any de bao phu logic tach token.
    const request = {
      headers: {
        authorization: 'Bearer token-123',
      },
    } as any;

    const token = (guard as any).extractTokenFromHeader(request);

    expect(token).toBe('token-123');
  });

  // Test Case ID: UT_AUTH_GUARD_009
  it('extractTokenFromHeader tra ve undefined khi header khong hop le', () => {
    // Muc tieu: dam bao helper tach token khong chap nhan schema khac Bearer.
    // Input: authorization = "Token token-123".
    // Ky vong: tra ve undefined.
    const request = {
      headers: {
        authorization: 'Token token-123',
      },
    } as any;

    const token = (guard as any).extractTokenFromHeader(request);

    expect(token).toBeUndefined();
  });
});
