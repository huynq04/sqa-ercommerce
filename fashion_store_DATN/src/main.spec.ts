import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

describe('main bootstrap', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('bootstraps app and applies all global setup', async () => {
    const logger = { info: jest.fn<(message: string) => void>() };
    const loggingService = {
      getLogger: jest.fn<(category: string) => typeof logger>(() => logger),
    };

    const app = {
      get: jest.fn<(token: unknown) => unknown>(() => loggingService),
      enableCors: jest.fn<(opts: unknown) => void>(),
      setGlobalPrefix: jest.fn<(prefix: string) => void>(),
      use: jest.fn<(mw: unknown) => void>(),
      useGlobalPipes: jest.fn<(pipe: unknown) => void>(),
      useGlobalFilters: jest.fn<(filter: unknown) => void>(),
      listen: jest.fn<(port: number) => Promise<void>>().mockResolvedValue(),
    };

    const create = jest.fn().mockImplementation(async () => app);
    const initSwagger = jest.fn<(a: unknown) => void>();

    jest.doMock('@nestjs/core', () => ({
      NestFactory: { create },
    }));
    jest.doMock(
      '@app.module',
      () => ({
        AppModule: class AppModule {},
      }),
      { virtual: true },
    );
    jest.doMock('@base/swagger', () => ({ initSwagger }));
    jest.doMock('@config', () => ({
      config: {
        PORT: 3000,
        HOST: 'http://localhost:3000',
        NODE_ENV: 'test',
      },
    }));
    jest.doMock('@base/filters/http-exception.filter', () => ({
      HttpExceptionLoggerFilter: class HttpExceptionLoggerFilter {},
    }));
    jest.doMock('@base/middleware/access-logger.middleware', () => ({
      AccessLoggerMiddleware: class AccessLoggerMiddleware {
        use() {
          return undefined;
        }
      },
    }));
    jest.doMock('@base/logging', () => ({
      LoggingService: class LoggingService {},
    }));

    await jest.isolateModulesAsync(async () => {
      await import('./main');
      await Promise.resolve();
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(app.enableCors).toHaveBeenCalledTimes(1);
    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
    expect(app.useGlobalPipes).toHaveBeenCalledTimes(1);
    expect(app.useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(app.use).toHaveBeenCalledTimes(4);
    expect(initSwagger).toHaveBeenCalledWith(app);
    expect(app.listen).toHaveBeenCalledWith(3000);
    expect(loggingService.getLogger).toHaveBeenCalledWith('Bootstrap');
    expect(logger.info).toHaveBeenCalledTimes(5);
  });

  it('logs startup error when bootstrap fails', async () => {
    const startupError = new Error('cannot start');
    const create = jest.fn().mockImplementation(async () => {
      throw startupError;
    });
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    jest.doMock('@nestjs/core', () => ({
      NestFactory: { create },
    }));
    jest.doMock(
      '@app.module',
      () => ({
        AppModule: class AppModule {},
      }),
      { virtual: true },
    );
    jest.doMock('@base/swagger', () => ({ initSwagger: jest.fn() }));
    jest.doMock('@config', () => ({
      config: {
        PORT: 3000,
        HOST: 'http://localhost:3000',
        NODE_ENV: 'test',
      },
    }));
    jest.doMock('@base/filters/http-exception.filter', () => ({
      HttpExceptionLoggerFilter: class HttpExceptionLoggerFilter {},
    }));
    jest.doMock('@base/middleware/access-logger.middleware', () => ({
      AccessLoggerMiddleware: class AccessLoggerMiddleware {
        use() {
          return undefined;
        }
      },
    }));
    jest.doMock('@base/logging', () => ({
      LoggingService: class LoggingService {},
    }));

    await jest.isolateModulesAsync(async () => {
      await import('./main');
      await Promise.resolve();
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Error starting application:',
      startupError,
    );
  });
});
