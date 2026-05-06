import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock(
  '@app.service',
  () => ({
    AppService: class AppService {},
  }),
  { virtual: true },
);

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  const appServiceMock = {
    getHello: jest.fn<() => string>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AppController(appServiceMock as unknown as AppService);
  });

  it('delegates hello response to service', () => {
    appServiceMock.getHello.mockReturnValue('Hello from mock');

    const result = controller.getHello();

    expect(appServiceMock.getHello).toHaveBeenCalledTimes(1);
    expect(result).toBe('Hello from mock');
  });
});
