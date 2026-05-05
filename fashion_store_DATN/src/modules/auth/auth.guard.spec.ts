import { UnauthorizedException } from '@nestjs/common';
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

import type { AuthGuard as AuthGuardType } from './auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

// Dung implementation that cua AuthGuard de khong bi global mock trong jest.setup.ts.
const { AuthGuard } = jest.requireActual('./auth.guard') as {
  AuthGuard: new (
    cacheManager: any,
    jwtService: JwtService,
    reflector: Reflector,
  ) => AuthGuardType;
};

describe('AuthGuard', () => {
  let guard: AuthGuardType;

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

    // Khoi tao truc tiep de unit test bo tach khoi Nest DI/proxy.
    guard = new AuthGuard(
      cacheManagerMock as any,
      jwtServiceMock as unknown as JwtService,
      reflectorMock as unknown as Reflector,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_AUTH_GUARD_001
  it('[TC_001] cho phép truy cập ngay nếu route được đánh dấu Public', async () => {
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

  // Test Case ID: TC_AUTH_GUARD_002
  it('[TC_002] ném UnauthorizedException khi không có Authorization header', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const { context } = createExecutionContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    // đảm bảo không đi vào bước verify token
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_AUTH_GUARD_003
  it('[TC_003] ném UnauthorizedException khi Authorization header không đúng định dạng Bearer', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const { context } = createExecutionContext('Basic abc-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_AUTH_GUARD_004
  it('[TC_004] ném UnauthorizedException khi verify token thất bại', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    const { context } = createExecutionContext('Bearer jwt-token');

    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('jwt invalid'));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith(
      'jwt-token',
      expect.any(Object),
    );
  });

  // Test Case ID: TC_AUTH_GUARD_005
  it('[TC_005] ném UnauthorizedException khi token không tồn tại trong cache (đã bị thu hồi hoặc hết hạn)', async () => {
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

    //kiểm tra cache lookup theo userId sau khi decode token
    expect(cacheManagerMock.get).toHaveBeenCalledWith('userToken:7');
  });

  // Test Case ID: TC_AUTH_GUARD_006
  it('[TC_006] ném UnauthorizedException khi token trong cache không khớp với token request', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    const { context } = createExecutionContext('Bearer jwt-token');

    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 7,
      email: 'u@example.com',
    });

    // token trong cache khác token request → nghi vấn token bị thay thế / reuse
    cacheManagerMock.get.mockResolvedValue('another-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    //kiểm tra cache lookup theo userId sau khi decode JWT
    expect(cacheManagerMock.get).toHaveBeenCalledWith('userToken:7');
  });

  it('[TC_007] trả về true và gán payload vào request.user khi token hợp lệ', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    const { context, request } = createExecutionContext('Bearer jwt-token');

    const payload = {
      sub: 9,
      email: 'ok@example.com',
      role: 'user',
    };

    jwtServiceMock.verifyAsync.mockResolvedValue(payload);
    cacheManagerMock.get.mockResolvedValue('jwt-token');

    const result = await guard.canActivate(context);

    expect(cacheManagerMock.get).toHaveBeenCalledWith('userToken:9');

    expect(result).toBe(true);

    // user info được attach vào request (context enrichment)
    expect(request.user).toEqual(payload);
  });

  // Test Case ID: TC_AUTH_GUARD_008
  it('[TC_008] extractTokenFromHeader trả về token khi header đúng định dạng Bearer', () => {
    const request = {
      headers: {
        authorization: 'Bearer token-123',
      },
    } as any;

    const token = (guard as any).extractTokenFromHeader(request);

    expect(token).toBe('token-123');
  });

  // Test Case ID: TC_AUTH_GUARD_009
  it('[TC_009] extractTokenFromHeader trả về undefined khi header không đúng schema Bearer', () => {
    const request = {
      headers: {
        authorization: 'Token token-123',
      },
    } as any;

    const token = (guard as any).extractTokenFromHeader(request);

    expect(token).toBeUndefined();
  });
  // Test Case ID: TC_AUTH_GUARD_010
  it('[TC_010] extractTokenFromHeader trả về undefined khi không có authorization header', () => {
    const request = { headers: {} } as any;

    const token = (guard as any).extractTokenFromHeader(request);

    expect(token).toBeUndefined();
  });
});
