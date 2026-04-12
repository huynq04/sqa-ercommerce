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

    return {
      host,
      response,
      status,
      json,
      request,
    };
  };

  beforeEach(() => {
    // Lam sach mock truoc moi test case de dam bao ket qua doc lap.
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
  });

  afterEach(() => {
    // Rollback: phuc hoi toan bo spy/mock ve trang thai goc.
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_HTTP_EXCEPTION_FILTER_001
  it('constructor tao thu muc logs neu chua ton tai', () => {
    // Muc tieu: dam bao constructor khoi tao environment log.
    // Input: fs.existsSync(logDir) = false.
    // Ky vong: fs.mkdirSync duoc goi 1 lan.
    existsSyncSpy.mockReturnValue(false);

    const filter = new HttpExceptionLoggerFilter();

    expect(filter).toBeDefined();
    expect(existsSyncSpy).toHaveBeenCalledTimes(1);
    expect(mkdirSyncSpy).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_HTTP_EXCEPTION_FILTER_002
  it('constructor khong tao thu muc logs neu da ton tai', () => {
    // Muc tieu: tranh tao thu muc thua khi logs da co san.
    // Input: fs.existsSync(logDir) = true.
    // Ky vong: fs.mkdirSync khong duoc goi.
    existsSyncSpy.mockReturnValue(true);

    const filter = new HttpExceptionLoggerFilter();

    expect(filter).toBeDefined();
    expect(mkdirSyncSpy).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_HTTP_EXCEPTION_FILTER_003
  it('catch voi HttpException tra ve status/body dung theo exception', () => {
    // Muc tieu: xac minh branch xu ly HttpException.
    // Input: BadRequestException voi message tuy chinh.
    // Ky vong:
    // - response.status = 400
    // - response.json nhan body tu HttpException
    // - appendFileSync duoc goi de ghi log
    existsSyncSpy.mockReturnValue(true);
    const filter = new HttpExceptionLoggerFilter();
    const { host, status, json } = createHttpHost();

    const exception = new BadRequestException('Du lieu khong hop le');
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(exception.getResponse());

    // CheckDB/LogStorage: xac minh da ghi log vao file.
    expect(appendFileSyncSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_HTTP_EXCEPTION_FILTER_004
  it('catch voi exception thuong tra ve 500 va body mac dinh', () => {
    // Muc tieu: xac minh branch xu ly loi khong phai HttpException.
    // Input: Error thong thuong.
    // Ky vong: status 500 + body { success: false, message }.
    existsSyncSpy.mockReturnValue(true);
    const filter = new HttpExceptionLoggerFilter();
    const { host, status, json } = createHttpHost();

    const exception = new Error('Unexpected error');
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Unexpected error',
    });

    expect(appendFileSyncSpy).toHaveBeenCalledTimes(1);
  });

  // Test Case ID: TC_HTTP_EXCEPTION_FILTER_005
  it('catch voi exception thuong khong co message su dung "Internal Server Error"', () => {
    // Muc tieu: bao phu fallback message mac dinh khi exception.message rong.
    // Input: object khong co truong message.
    // Ky vong: message fallback = Internal Server Error.
    existsSyncSpy.mockReturnValue(true);
    const filter = new HttpExceptionLoggerFilter();
    const { host, status, json } = createHttpHost();

    filter.catch({}, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal Server Error',
    });
  });

  // Test Case ID: TC_HTTP_EXCEPTION_FILTER_006
  it('logLine ghi dung status va keyword http-exception', () => {
    // Muc tieu: xac minh noi dung log co thong tin status va marker (http-exception).
    existsSyncSpy.mockReturnValue(true);
    const filter = new HttpExceptionLoggerFilter();
    const { host } = createHttpHost();

    const exception = new BadRequestException('Sai format');
    filter.catch(exception, host);

    const appendCall = appendFileSyncSpy.mock.calls[0];
    expect(appendCall).toBeDefined();
    // appendCall[1] la noi dung log line.
    expect(String(appendCall[1])).toContain('400');
    expect(String(appendCall[1])).toContain('(http-exception)');
  });
});
