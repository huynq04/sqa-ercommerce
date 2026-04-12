import { describe, expect, it, jest } from '@jest/globals';

jest.mock(
  '@app.controller',
  () => ({
    AppController: class AppController {},
  }),
  { virtual: true },
);

jest.mock(
  '@app.service',
  () => ({
    AppService: class AppService {},
  }),
  { virtual: true },
);

import { AccessLoggerMiddleware } from '@base/middleware/access-logger.middleware';
import { AppModule } from './app.module';

describe('AppModule', () => {
  it('configures access logger middleware for all routes', () => {
    const forRoutes = jest.fn<(path: string) => void>();
    const apply = jest.fn<(mw: unknown) => { forRoutes: (path: string) => void }>(
      () => ({ forRoutes }),
    );

    const consumer = { apply };
    const module = new AppModule();

    module.configure(consumer as any);

    expect(apply).toHaveBeenCalledWith(AccessLoggerMiddleware);
    expect(forRoutes).toHaveBeenCalledWith('*');
  });
});
