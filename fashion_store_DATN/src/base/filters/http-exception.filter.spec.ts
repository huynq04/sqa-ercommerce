import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

import { HttpExceptionLoggerFilter } from './http-exception.filter';

jest.mock('fs', () => ({
  ...(jest.requireActual('fs') as typeof import('fs')),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  appendFileSync: jest.fn(),
}));

describe('HttpExceptionLoggerFilter', () => {
  let existsSyncSpy: jest.MockedFunction<typeof fs.existsSync>;
  let mkdirSyncSpy: jest.MockedFunction<typeof fs.mkdirSync>;
  let appendFileSyncSpy: jest.MockedFunction<typeof fs.appendFileSync>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  const FIXED_DATE = '2024-01-01T00:00:00.000Z';

  const createHttpHost = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    const response = { status };
    const request = {
      method: 'GET',
      url: '/test',
      headers: {},
    };

    const host = {
      switchToHttp: () => ({
        getResponse: <T = any>() => response as T,
        getRequest: <T = any>() => request as T,
        getNext: <T = any>() => undefined as T,
      }),
    } as ArgumentsHost;

    return { host, status, json };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    existsSyncSpy = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    mkdirSyncSpy = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;
    appendFileSyncSpy = fs.appendFileSync as jest.MockedFunction<
      typeof fs.appendFileSync
    >;

    mkdirSyncSpy.mockImplementation(() => undefined as any);
    appendFileSyncSpy.mockImplementation(() => undefined);

    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    jest.useFakeTimers().setSystemTime(new Date(FIXED_DATE));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // CONSTRUCTOR
  /**
   * TC_HTTP_EXCEPTION_FILTER_001
   */
  it('[TC_001] constructor tạo thư mục logs nếu chưa tồn tại', () => {
    existsSyncSpy.mockReturnValue(false);

    const filter = new HttpExceptionLoggerFilter();

    expect(filter).toBeDefined();
    expect(existsSyncSpy).toHaveBeenCalledTimes(1);
    expect(mkdirSyncSpy).toHaveBeenCalledTimes(1);
  });

  /**
   * TC_HTTP_EXCEPTION_FILTER_002
   */
  it('[TC_002] constructor không tạo thư mục logs nếu đã tồn tại', () => {
    existsSyncSpy.mockReturnValue(true);

    const filter = new HttpExceptionLoggerFilter();

    expect(filter).toBeDefined();
    expect(mkdirSyncSpy).not.toHaveBeenCalled();
  });

  // HTTP EXCEPTION
  /**
   * TC_HTTP_EXCEPTION_FILTER_003
   */
  it('[TC_003] catch HttpException trả đúng status + message', () => {
    existsSyncSpy.mockReturnValue(true);
    const filter = new HttpExceptionLoggerFilter();
    const { host, status, json } = createHttpHost();

    const exception = new BadRequestException('Dữ liệu không hợp lệ');
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Dữ liệu không hợp lệ',
      }),
    );

    expect(appendFileSyncSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('DEBUG'),
    );
  });

  /**
   * TC_HTTP_EXCEPTION_FILTER_004
   */
  it('[TC_004] catch HttpException trả object body', () => {
    existsSyncSpy.mockReturnValue(true);
    const filter = new HttpExceptionLoggerFilter();
    const { host, json } = createHttpHost();

    const exception = new BadRequestException({
      message: 'Invalid data',
      error: 'Bad Request',
    });

    filter.catch(exception, host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid data',
      }),
    );
  });

  // NORMAL ERROR
  /**
   * TC_HTTP_EXCEPTION_FILTER_005
   */
  it('[TC_005] catch Error thường trả 500 + message', () => {
    existsSyncSpy.mockReturnValue(true);
    const filter = new HttpExceptionLoggerFilter();
    const { host, status, json } = createHttpHost();

    const exception = new Error('Unexpected error');
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Unexpected error',
      }),
    );

    expect(appendFileSyncSpy).toHaveBeenCalledTimes(1);
  });

  /**
   * TC_HTTP_EXCEPTION_FILTER_006
   */
  it('[TC_006] fallback message khi exception không có message', () => {
    existsSyncSpy.mockReturnValue(true);
    const filter = new HttpExceptionLoggerFilter();
    const { host, status, json } = createHttpHost();

    filter.catch({}, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Internal Server Error',
      }),
    );
  });

  // LOGGING
  /**
   * TC_HTTP_EXCEPTION_FILTER_007
   */
  it('[TC_007] log chứa đầy đủ thông tin', () => {
    existsSyncSpy.mockReturnValue(true);
    const filter = new HttpExceptionLoggerFilter();
    const { host } = createHttpHost();

    const exception = new BadRequestException('Sai format');
    filter.catch(exception, host);

    const appendCall = appendFileSyncSpy.mock.calls[0];

    const filePath = appendCall[0];
    const logContent = String(appendCall[1]);

    expect(filePath).toContain(path.join('logs', 'http-exception.log'));

    expect(logContent).toContain('DEBUG');
    expect(logContent).toContain('400');
    expect(logContent).toContain('Sai format');
    expect(logContent).toContain('(http-exception)');
    expect(logContent).toContain(FIXED_DATE);

    expect(logContent).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});
