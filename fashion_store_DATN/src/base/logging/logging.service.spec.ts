import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { LoggingService } from './logging.service';
import { configure, getLogger } from 'log4js';

jest.mock('log4js', () => ({
  configure: jest.fn(),
  getLogger: jest.fn(),
}));

describe('LoggingService', () => {
  const configureMock = configure as jest.MockedFunction<typeof configure>;
  const getLoggerMock = getLogger as jest.MockedFunction<typeof getLogger>;

  const loggerMock = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as any;

  beforeEach(() => {
    // Lam sach mock truoc moi testcase de tranh anh huong cheo.
    jest.clearAllMocks();
    getLoggerMock.mockReturnValue(loggerMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_LOGGING_SERVICE_001
  it('constructor goi configure voi cau hinh appenders/categories', () => {
    // Muc tieu: dam bao logging config duoc khoi tao ngay khi tao service.
    // Input: khoi tao instance LoggingService.
    // Ky vong: configure duoc goi 1 lan voi object co appenders va categories.
    const service = new LoggingService();

    expect(service).toBeDefined();
    expect(configureMock).toHaveBeenCalledTimes(1);
    expect(configureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        appenders: expect.objectContaining({
          console: expect.any(Object),
          file: expect.any(Object),
          errorFile: expect.any(Object),
          errorFilter: expect.any(Object),
        }),
        categories: expect.objectContaining({
          default: expect.any(Object),
        }),
      }),
    );
  });

  // Test Case ID: TC_LOGGING_SERVICE_002
  it('getLogger tra ve logger theo category truyen vao', () => {
    // Muc tieu: xac minh service wrapper goi dung getLogger(category).
    // Input: category = UserService.
    // Ky vong: getLogger cua log4js duoc goi voi category va tra logger.
    const service = new LoggingService();

    const logger = service.getLogger('UserService');

    expect(getLoggerMock).toHaveBeenCalledWith('UserService');
    expect(logger).toBe(loggerMock);
  });

  // Test Case ID: TC_LOGGING_SERVICE_003
  it('getLogger dung category mac dinh la default khi khong truyen', () => {
    // Muc tieu: dam bao behavior mac dinh cua getLogger().
    const service = new LoggingService();

    const logger = service.getLogger();

    expect(getLoggerMock).toHaveBeenCalledWith('default');
    expect(logger).toBe(loggerMock);
  });

  // Test Case ID: TC_LOGGING_SERVICE_004
  it('logError goi logger.error voi error.message neu co', () => {
    // Muc tieu: xac minh logError uu tien message trong object error.
    // Input: Error('DB failed').
    // Ky vong: getLogger('Error') va logger.error('DB failed').
    const service = new LoggingService();

    service.logError(new Error('DB failed'));

    // CheckDB/LogStorage (gian tiep): xac minh log error duoc ghi qua logger.
    expect(getLoggerMock).toHaveBeenCalledWith('Error');
    expect(loggerMock.error).toHaveBeenCalledWith('DB failed');
  });

  // Test Case ID: TC_LOGGING_SERVICE_005
  it('logError goi logger.error voi input goc neu khong co message', () => {
    // Muc tieu: bao phu nhanh fallback khi error khong co property message.
    const service = new LoggingService();

    service.logError('plain-error-text');

    expect(getLoggerMock).toHaveBeenCalledWith('Error');
    expect(loggerMock.error).toHaveBeenCalledWith('plain-error-text');
  });
});
