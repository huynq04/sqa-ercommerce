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
  it('[TC_LOGGING_SERVICE_001] LoggingService khởi tạo phải tự động configure logging system với appenders và categories', () => {
    const service = new LoggingService();

    const expectedConfigShape = {
      appenders: {
        console: expect.any(Object),
        file: expect.any(Object),
        errorFile: expect.any(Object),
        errorFilter: expect.any(Object),
      },
      categories: {
        default: expect.any(Object),
      },
    };

    expect(service).toBeDefined();

    expect(configureMock).toHaveBeenCalledTimes(1);
    expect(configureMock).toHaveBeenCalledWith(
      expect.objectContaining(expectedConfigShape),
    );
  });

  // Test Case ID: TC_LOGGING_SERVICE_002
  it('[TC_LOGGING_SERVICE_002] LoggingService trả về logger đúng theo category được truyền vào', () => {
    const service = new LoggingService();

    const category = 'UserService';
    const logger = service.getLogger(category);

    expect(getLoggerMock).toHaveBeenCalledTimes(1);
    expect(getLoggerMock).toHaveBeenCalledWith(category);

    expect(logger).toBe(loggerMock);
  });

  // Test Case ID: TC_LOGGING_SERVICE_003
  it('[TC_LOGGING_SERVICE_003] LoggingService trả về logger với category mặc định "default" khi không truyền tham số', () => {
    const service = new LoggingService();

    const logger = service.getLogger();

    expect(getLoggerMock).toHaveBeenCalledTimes(1);
    expect(getLoggerMock).toHaveBeenCalledWith('default');

    expect(logger).toBe(loggerMock);
  });

  // Test Case ID: TC_LOGGING_SERVICE_004
  it('[TC_LOGGING_SERVICE_004] LoggingService ghi log error đúng message từ Error object', () => {
    const service = new LoggingService();

    const error = new Error('DB failed');

    service.logError(error);

    expect(getLoggerMock).toHaveBeenCalledTimes(1);
    expect(getLoggerMock).toHaveBeenCalledWith('Error');

    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenCalledWith(error.message);
  });

  // Test Case ID: TC_LOGGING_SERVICE_005
  it('[TC_LOGGING_SERVICE_005] LoggingService ghi log error đúng nguyên gốc khi input không phải Error object', () => {
    const service = new LoggingService();

    const input = 'plain-error-text';

    service.logError(input);

    expect(getLoggerMock).toHaveBeenCalledTimes(1);
    expect(getLoggerMock).toHaveBeenCalledWith('Error');

    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenCalledWith(input);
  });
});
