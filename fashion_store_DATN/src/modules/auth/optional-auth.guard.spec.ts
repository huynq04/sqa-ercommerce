import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { OptionalAuthGuard } from './optional-auth.guard';

describe('OptionalAuthGuard', () => {
  let guard: OptionalAuthGuard;

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

  beforeEach(async () => {
    // Reset lich su mock de test case doc lap voi nhau.
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionalAuthGuard,
        {
          provide: 'CACHE_MANAGER',
          useValue: cacheManagerMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    guard = module.get<OptionalAuthGuard>(OptionalAuthGuard);
  });

  afterEach(() => {
    // Rollback cho unit test su dung mock: khoi phuc spy va mock state.
    jest.restoreAllMocks();
  });

  // Test Case ID: UT_OPTIONAL_AUTH_GUARD_001
  it('tra ve true khi request khong co token', async () => {
    // Muc tieu: guard optional phai cho phep guest di qua.
    // Input: request khong co Authorization header.
    // Ky vong: canActivate tra ve true, khong goi verify token.
    const { context } = createExecutionContext(undefined);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
    expect(cacheManagerMock.get).not.toHaveBeenCalled();
  });

  // Test Case ID: UT_OPTIONAL_AUTH_GUARD_002
  it('tra ve true khi Authorization khong dung dinh dang Bearer', async () => {
    // Muc tieu: header sai schema duoc xem nhu guest.
    // Input: authorization = Basic <token>.
    // Ky vong: canActivate tra true va bo qua verifyAsync.
    const { context } = createExecutionContext('Basic token-abc');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  // Test Case ID: UT_OPTIONAL_AUTH_GUARD_003
  it('tra ve true khi verify token bi loi', async () => {
    // Muc tieu: token loi khong chan request, chi coi la guest.
    // Input: verifyAsync nem exception.
    // Ky vong: canActivate tra true, request.user khong duoc gan.
    const { context, request } = createExecutionContext('Bearer bad-token');
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid token'));

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toBeUndefined();
  });

  // Test Case ID: UT_OPTIONAL_AUTH_GUARD_004
  it('tra ve true khi token khong ton tai trong cache', async () => {
    // Muc tieu: token khong duoc cache xac nhan se bi ha cap thanh guest.
    // Input: verifyAsync thanh cong, cacheManager.get tra undefined.
    // Ky vong: canActivate true, request.user khong co.
    const { context, request } = createExecutionContext('Bearer jwt-token');
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 5,
      email: 'u@example.com',
    });
    cacheManagerMock.get.mockResolvedValue(undefined);

    const result = await guard.canActivate(context);

    // CheckDB/Cache: xac minh guard co doi chieu key userToken:<sub>.
    expect(cacheManagerMock.get).toHaveBeenCalledWith('userToken:5');
    expect(result).toBe(true);
    expect(request.user).toBeUndefined();
  });

  // Test Case ID: UT_OPTIONAL_AUTH_GUARD_005
  it('tra ve true khi token trong cache khac token request', async () => {
    // Muc tieu: token mismatch duoc xem nhu guest.
    // Input: verifyAsync thanh cong, cachedToken != request token.
    // Ky vong: canActivate true, request.user khong duoc gan.
    const { context, request } = createExecutionContext('Bearer jwt-token');
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 5,
      email: 'u@example.com',
    });
    cacheManagerMock.get.mockResolvedValue('another-token');

    const result = await guard.canActivate(context);

    expect(cacheManagerMock.get).toHaveBeenCalledWith('userToken:5');
    expect(result).toBe(true);
    expect(request.user).toBeUndefined();
  });

  // Test Case ID: UT_OPTIONAL_AUTH_GUARD_006
  it('gan request.user va tra ve true khi token hop le', async () => {
    // Muc tieu: trong optional mode, neu token hop le thi van gan user context.
    // Input: token verify thanh cong va trung token trong cache.
    // Ky vong: canActivate true va request.user = payload.
    const { context, request } = createExecutionContext('Bearer jwt-token');
    const payload = { sub: 9, email: 'ok@example.com', role: 'user' };
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);
    cacheManagerMock.get.mockResolvedValue('jwt-token');

    const result = await guard.canActivate(context);

    expect(cacheManagerMock.get).toHaveBeenCalledWith('userToken:9');
    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
  });

  // Test Case ID: UT_OPTIONAL_AUTH_GUARD_007
  it('extractTokenFromHeader tra ve token khi dung Bearer schema', () => {
    // Test private method qua ep kieu any de bao phu logic tach token.
    const request = {
      headers: {
        authorization: 'Bearer token-123',
      },
    } as any;

    const token = (guard as any).extractTokenFromHeader(request);

    expect(token).toBe('token-123');
  });

  // Test Case ID: UT_OPTIONAL_AUTH_GUARD_008
  it('extractTokenFromHeader tra ve undefined khi schema khong hop le', () => {
    const request = {
      headers: {
        authorization: 'Token token-123',
      },
    } as any;

    const token = (guard as any).extractTokenFromHeader(request);

    expect(token).toBeUndefined();
  });
});
