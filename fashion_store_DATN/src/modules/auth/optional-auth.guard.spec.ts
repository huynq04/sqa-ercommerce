import { JwtService } from '@nestjs/jwt';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import type { OptionalAuthGuard as OptionalAuthGuardType } from './optional-auth.guard';

// Dung implementation that cua OptionalAuthGuard de tranh bi global mock trong jest.setup.ts.
const { OptionalAuthGuard } = jest.requireActual('./optional-auth.guard') as {
  OptionalAuthGuard: new (
    cacheManager: any,
    jwtService: JwtService,
  ) => OptionalAuthGuardType;
};

describe('OptionalAuthGuard', () => {
  let guard: OptionalAuthGuardType;

  // Mock dependency ngoai de test logic guard theo dung don vi (unit).
  const cacheManagerMock = {
    get: jest.fn<(...args: any[]) => Promise<string | undefined>>(),
  };

  const jwtServiceMock = {
    verifyAsync: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  // Tao ExecutionContext gia lap cho request HTTP.
  const createExecutionContext = (authorization?: string) => {
    const request: Record<string, any> = {
      headers: {
        authorization,
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    return {
      context: context as any,
      request,
    };
  };

  beforeEach(() => {
    // Reset lich su mock de test case doc lap voi nhau.
    jest.clearAllMocks();

    // Khoi tao truc tiep de unit test bo tach khoi Nest DI/proxy.
    guard = new OptionalAuthGuard(
      cacheManagerMock as any,
      jwtServiceMock as unknown as JwtService,
    );
  });

  afterEach(() => {
    // Rollback cho unit test su dung mock: khoi phuc spy va mock state.
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_OPTIONAL_AUTH_GUARD_001
  it('[TC_OPTIONAL_001] cho phép truy cập khi không có Authorization header (guest access)', async () => {
    const { context, request } = createExecutionContext(undefined);

    const result = await guard.canActivate(context);

    // Core expectation
    expect(result).toBe(true);

    // Ensure no authentication flow triggered
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
    expect(cacheManagerMock.get).not.toHaveBeenCalled();

    // Ensure request is not mutated
    expect(request.user).toBeUndefined();
  });

  // Test Case ID: TC_OPTIONAL_AUTH_GUARD_002
  it('[TC_OPTIONAL_002] cho phép truy cập khi Authorization không đúng định dạng Bearer (coi như guest)', async () => {
    const { context, request } = createExecutionContext('Basic token-abc');

    const result = await guard.canActivate(context);

    // Core expectation
    expect(result).toBe(true);

    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
    expect(cacheManagerMock.get).not.toHaveBeenCalled();

    // Ensure request is not mutated
    expect(request.user).toBeUndefined();
  });

  // Test Case ID: TC_OPTIONAL_AUTH_GUARD_003
  it('[TC_OPTIONAL_003] cho phép truy cập khi verify token thất bại (coi như guest)', async () => {
    const { context, request } = createExecutionContext('Bearer bad-token');

    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid token'));

    const result = await guard.canActivate(context);

    expect(result).toBe(true);

    // Verify authentication attempt happened
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledTimes(1);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith(
      'bad-token',
      expect.any(Object),
    );

    expect(cacheManagerMock.get).not.toHaveBeenCalled();

    // Ensure request is not mutated
    expect(request.user).toBeUndefined();
  });

  // Test Case ID: TC_OPTIONAL_AUTH_GUARD_004
  it('[TC_OPTIONAL_004] cho phép truy cập khi token không tồn tại trong cache (coi như guest)', async () => {
    const { context, request } = createExecutionContext('Bearer jwt-token');

    const payload = {
      sub: 5,
      email: 'u@example.com',
    };

    // verify thành công → lấy được payload
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);

    // cache không có token → token không hợp lệ về mặt session
    cacheManagerMock.get.mockResolvedValue(undefined);

    const result = await guard.canActivate(context);

    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledTimes(1);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith(
      'jwt-token',
      expect.any(Object),
    );

    // CheckDB/Cache: có kiểm tra token trong cache theo userId
    expect(cacheManagerMock.get).toHaveBeenCalledTimes(1);
    expect(cacheManagerMock.get).toHaveBeenCalledWith(
      `userToken:${payload.sub}`,
    );

    // Kết quả: không chặn request nhưng cũng không attach user
    expect(result).toBe(true);
    expect(request.user).toBeUndefined();
  });

  // Test Case ID: TC_OPTIONAL_AUTH_GUARD_005
  it('[TC_OPTIONAL_005] cho phép truy cập khi token trong cache khác token request (coi như guest)', async () => {
    const { context, request } = createExecutionContext('Bearer jwt-token');

    const payload = {
      sub: 5,
      email: 'u@example.com',
    };

    // verify JWT thành công
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);

    cacheManagerMock.get.mockResolvedValue('another-token');

    const result = await guard.canActivate(context);

    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledTimes(1);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith(
      'jwt-token',
      expect.any(Object),
    );

    // CheckDB/Cache: có kiểm tra token trong cache theo userId
    expect(cacheManagerMock.get).toHaveBeenCalledTimes(1);
    expect(cacheManagerMock.get).toHaveBeenCalledWith(
      `userToken:${payload.sub}`,
    );

    // Kết quả: không chặn request nhưng không attach user
    expect(result).toBe(true);
    expect(request.user).toBeUndefined();
  });

  // Test Case ID: TC_OPTIONAL_AUTH_GUARD_006
  it('[TC_OPTIONAL_006] gán request.user và cho phép truy cập khi token hợp lệ', async () => {
    const { context, request } = createExecutionContext('Bearer jwt-token');

    const payload = {
      sub: 9,
      email: 'ok@example.com',
      role: 'user',
    };

    // verify JWT thành công
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);

    // cache chứa đúng token → session hợp lệ
    cacheManagerMock.get.mockResolvedValue('jwt-token');

    const result = await guard.canActivate(context);

    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledTimes(1);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith(
      'jwt-token',
      expect.any(Object),
    );

    expect(cacheManagerMock.get).toHaveBeenCalledTimes(1);
    expect(cacheManagerMock.get).toHaveBeenCalledWith(
      `userToken:${payload.sub}`,
    );

    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
  });

  // Test Case ID: TC_OPTIONAL_AUTH_GUARD_007
  it('[TC_OPTIONAL_007] extractTokenFromHeader trả về token khi header đúng định dạng Bearer', () => {
    const request = {
      headers: {
        authorization: 'Bearer token-123',
      },
    } as any;

    // gọi hàm private thông qua ép kiểu any
    const token = (guard as any).extractTokenFromHeader(request);

    // token được tách chính xác
    expect(token).toBe('token-123');
  });

  // Test Case ID: TC_OPTIONAL_AUTH_GUARD_008
  it('[TC_OPTIONAL_008] extractTokenFromHeader trả về undefined khi Authorization không đúng schema Bearer', () => {
    const request = {
      headers: {
        authorization: 'Token token-123',
      },
    } as any;

    const token = (guard as any).extractTokenFromHeader(request);

    expect(token).toBeUndefined();
  });
});
