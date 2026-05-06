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
  it('[TC_ACCESS_LOGGER_001] AccessLoggerMiddleware khởi tạo phải tạo thư mục logs nếu chưa tồn tại', () => {
    existsSyncSpy.mockReturnValue(false);

    const middleware = new AccessLoggerMiddleware();

    expect(middleware).toBeDefined();

    // verify middleware kiểm tra tồn tại thư mục logs
    expect(existsSyncSpy).toHaveBeenCalledTimes(1);

    //verify middleware tạo thư mục logs khi chưa tồn tại
    expect(mkdirSyncSpy).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_ACCESS_LOGGER_002
  it('[TC_ACCESS_LOGGER_002] AccessLoggerMiddleware không tạo thư mục logs khi thư mục đã tồn tại', () => {
    existsSyncSpy.mockReturnValue(true);

    const middleware = new AccessLoggerMiddleware();

    expect(middleware).toBeDefined();

    // verify middleware không gọi tạo thư mục khi đã tồn tại
    expect(existsSyncSpy).toHaveBeenCalledTimes(1);
    expect(mkdirSyncSpy).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_ACCESS_LOGGER_003
  it('[TC_ACCESS_LOGGER_003] AccessLoggerMiddleware phải gọi next() và đăng ký event finish để ghi access log', () => {
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

    // middleware phải đăng ký listener finish
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));

    finishHandlers.forEach((handler) => handler());

    // verify access log được ghi ra file
    const logLines = appendFileSyncSpy.mock.calls.map((call) =>
      String(call[1]),
    );

    expect(logLines.some((line) => line.includes('(access)'))).toBe(true);

    // CheckOutput: verify log console debug/info được gọi
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_ACCESS_LOGGER_004
  it('[TC_ACCESS_LOGGER_004] AccessLoggerMiddleware ghi debug log khi statusCode >= 400', () => {
    existsSyncSpy.mockReturnValue(true);

    const middleware = new AccessLoggerMiddleware();

    const { req, res, next } = createReqResNext({
      statusCode: 404,
    });

    middleware.use(req as any, res as any, next as any);

    // Trigger response send để middleware xử lý log
    res.send({ message: 'Not Found' });

    expect(next).toHaveBeenCalledTimes(1);

    // verify error log được ghi ra file
    const logLines = appendFileSyncSpy.mock.calls.map((call) =>
      String(call[1]),
    );

    expect(logLines.some((line) => line.includes('(http-exception)'))).toBe(
      true,
    );

    //verify error logging được gọi
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_ACCESS_LOGGER_005
  it('[TC_ACCESS_LOGGER_005] AccessLoggerMiddleware ghi debug log khi business success = false dù statusCode < 400', () => {
    existsSyncSpy.mockReturnValue(true);

    const middleware = new AccessLoggerMiddleware();

    const { req, res, next } = createReqResNext({
      statusCode: 200,
    });

    middleware.use(req as any, res as any, next as any);

    res.send({
      success: false,
      message: 'Business validation failed',
    });

    expect(next).toHaveBeenCalledTimes(1);

    // verify log exception được ghi
    const logLines = appendFileSyncSpy.mock.calls.map((call) =>
      String(call[1]),
    );

    expect(logLines.some((line) => line.includes('(http-exception)'))).toBe(
      true,
    );

    //  verify error log console được gọi
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
  it('[TC_ACCESS_LOGGER_007] AccessLoggerMiddleware chỉ ghi debug log một lần dù res.send được gọi nhiều lần', () => {
    // Arrange
    existsSyncSpy.mockReturnValue(true);

    const middleware = new AccessLoggerMiddleware();

    const { req, res, next } = createReqResNext({
      statusCode: 500,
    });

    // Act
    middleware.use(req as any, res as any, next as any);

    res.send({ success: false, message: 'Error 1' });
    res.send({ success: false, message: 'Error 2' });

    // Assert flow execution
    expect(next).toHaveBeenCalledTimes(1);

    // CheckLogStorage (gián tiếp): chỉ được log 1 lần cho exception
    const debugLines = appendFileSyncSpy.mock.calls
      .map((call) => String(call[1]))
      .filter((line) => line.includes('(http-exception)'));

    expect(debugLines).toHaveLength(1);
  });

  // Test Case ID: TC_ACCESS_LOGGER_008
  it('[TC_ACCESS_LOGGER_008] AccessLoggerMiddleware không ghi debug log khi headersSent = true', () => {
    // Arrange
    existsSyncSpy.mockReturnValue(true);

    const middleware = new AccessLoggerMiddleware();

    const { req, res, next } = createReqResNext({
      statusCode: 500,
      headersSent: true,
    });

    // Act
    middleware.use(req as any, res as any, next as any);

    res.send({ success: false, message: 'Late error' });

    // Assert flow execution
    expect(next).toHaveBeenCalledTimes(1);

    //không được ghi exception log khi headers đã sent
    const debugLines = appendFileSyncSpy.mock.calls
      .map((call) => String(call[1]))
      .filter((line) => line.includes('(http-exception)'));

    expect(debugLines).toHaveLength(0);
  });
});
