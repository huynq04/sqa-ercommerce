import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as fs from 'fs';

import { AccessLoggerMiddleware } from './access-logger.middleware';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  appendFileSync: jest.fn(),
}));

describe('AccessLoggerMiddleware', () => {
  let existsSyncSpy: jest.MockedFunction<typeof fs.existsSync>;
  let mkdirSyncSpy: jest.MockedFunction<typeof fs.mkdirSync>;
  let appendFileSyncSpy: jest.MockedFunction<typeof fs.appendFileSync>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  const createReqResNext = (options?: {
    statusCode?: number;
    headersSent?: boolean;
    userName?: string;
    ip?: string;
    method?: string;
    originalUrl?: string;
  }) => {
    const finishHandlers: Array<() => void> = [];

    const req: Record<string, any> = {
      ip: options?.ip ?? '127.0.0.1',
      method: options?.method ?? 'GET',
      originalUrl: options?.originalUrl ?? '/api/test',
      socket: { remoteAddress: '::1' },
      user: options?.userName ? { username: options.userName } : undefined,
    };

    const originalSendMock = jest.fn((body?: any) => body);

    const res: Record<string, any> = {
      statusCode: options?.statusCode ?? 200,
      headersSent: options?.headersSent ?? false,
      send: originalSendMock,
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandlers.push(handler);
        }
        return res;
      }),
    };

    const next = jest.fn();

    return {
      req,
      res,
      next,
      finishHandlers,
      originalSendMock,
    };
  };

  beforeEach(() => {
    // Lam sach mock truoc moi test case de tranh anh huong cheo.
    jest.clearAllMocks();

    existsSyncSpy = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    mkdirSyncSpy = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;
    appendFileSyncSpy = fs.appendFileSync as jest.MockedFunction<
      typeof fs.appendFileSync
    >;

    mkdirSyncSpy.mockImplementation(() => undefined as any);
    appendFileSyncSpy.mockImplementation(() => undefined);
    consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    // Rollback toan bo spy/mock ve trang thai goc.
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_ACCESS_LOGGER_001
  it('constructor tao thu muc logs neu chua ton tai', () => {
    // Muc tieu: dam bao middleware tao folder log khi app start.
    existsSyncSpy.mockReturnValue(false);

    const middleware = new AccessLoggerMiddleware();

    expect(middleware).toBeDefined();
    expect(existsSyncSpy).toHaveBeenCalledTimes(1);
    expect(mkdirSyncSpy).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_ACCESS_LOGGER_002
  it('constructor khong tao thu muc logs neu da ton tai', () => {
    // Muc tieu: tranh mkdir thua neu thu muc logs da co.
    existsSyncSpy.mockReturnValue(true);

    const middleware = new AccessLoggerMiddleware();

    expect(middleware).toBeDefined();
    expect(mkdirSyncSpy).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_ACCESS_LOGGER_003
  it('use goi next va dang ky su kien finish de ghi access log', () => {
    // Muc tieu: dam bao middleware khong chan request va co gan logger cho response.
    existsSyncSpy.mockReturnValue(true);
    const middleware = new AccessLoggerMiddleware();
    const { req, res, next, finishHandlers } = createReqResNext({
      userName: 'admin01',
      statusCode: 201,
      method: 'POST',
      originalUrl: '/users',
    });

    middleware.use(req as any, res as any, next as any);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));

    // Gia lap ket thuc response de trigger ghi access log.
    finishHandlers.forEach((handler) => handler());

    // CheckDB/LogStorage: xac minh appendFileSync duoc goi voi log access.
    const allLogCalls = appendFileSyncSpy.mock.calls.map((call) =>
      String(call[1]),
    );
    expect(allLogCalls.some((line) => line.includes('(access)'))).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_ACCESS_LOGGER_004
  it('ghi debug log khi statusCode >= 400', () => {
    // Muc tieu: branch loi theo status code phai ghi debug log.
    existsSyncSpy.mockReturnValue(true);
    const middleware = new AccessLoggerMiddleware();
    const { req, res, next } = createReqResNext({ statusCode: 404 });

    middleware.use(req as any, res as any, next as any);

    // Goi send voi body object de middleware parse duoc data.
    res.send({ message: 'Not Found' });

    const allLogCalls = appendFileSyncSpy.mock.calls.map((call) =>
      String(call[1]),
    );
    expect(allLogCalls.some((line) => line.includes('(http-exception)'))).toBe(
      true,
    );
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_ACCESS_LOGGER_005
  it('ghi debug log khi data.success = false du status code < 400', () => {
    // Muc tieu: branch loi nghiep vu (success=false) phai ghi debug.
    existsSyncSpy.mockReturnValue(true);
    const middleware = new AccessLoggerMiddleware();
    const { req, res, next } = createReqResNext({ statusCode: 200 });

    middleware.use(req as any, res as any, next as any);
    res.send({ success: false, message: 'Business validation failed' });

    const allLogCalls = appendFileSyncSpy.mock.calls.map((call) =>
      String(call[1]),
    );
    expect(allLogCalls.some((line) => line.includes('(http-exception)'))).toBe(
      true,
    );
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_ACCESS_LOGGER_006
  it('khong ghi debug log khi body khong parse duoc JSON string', () => {
    // Muc tieu: bao phu catch parse JSON trong wrapper res.send.
    existsSyncSpy.mockReturnValue(true);
    const middleware = new AccessLoggerMiddleware();
    const { req, res, next } = createReqResNext({ statusCode: 200 });

    middleware.use(req as any, res as any, next as any);
    res.send('not-a-json-string');

    const allLogCalls = appendFileSyncSpy.mock.calls.map((call) =>
      String(call[1]),
    );
    expect(allLogCalls.some((line) => line.includes('(http-exception)'))).toBe(
      false,
    );
  });

  // Test Case ID: TC_ACCESS_LOGGER_007
  it('chi ghi debug log mot lan khi res.send duoc goi nhieu lan', () => {
    // Muc tieu: bien debugLogged ngan ghi debug trung lap.
    existsSyncSpy.mockReturnValue(true);
    const middleware = new AccessLoggerMiddleware();
    const { req, res, next } = createReqResNext({ statusCode: 500 });

    middleware.use(req as any, res as any, next as any);
    res.send({ success: false, message: 'Error 1' });
    res.send({ success: false, message: 'Error 2' });

    const debugLines = appendFileSyncSpy.mock.calls
      .map((call) => String(call[1]))
      .filter((line) => line.includes('(http-exception)'));

    expect(debugLines).toHaveLength(1);
  });

  // Test Case ID: TC_ACCESS_LOGGER_008
  it('khong ghi debug log khi headersSent = true', () => {
    // Muc tieu: nhanh chan debug neu response da gui header.
    existsSyncSpy.mockReturnValue(true);
    const middleware = new AccessLoggerMiddleware();
    const { req, res, next } = createReqResNext({
      statusCode: 500,
      headersSent: true,
    });

    middleware.use(req as any, res as any, next as any);
    res.send({ success: false, message: 'Late error' });

    const debugLines = appendFileSyncSpy.mock.calls
      .map((call) => String(call[1]))
      .filter((line) => line.includes('(http-exception)'));

    expect(debugLines).toHaveLength(0);
  });
});
