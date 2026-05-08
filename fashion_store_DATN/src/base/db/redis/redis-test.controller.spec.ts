import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { RedisTestController } from './redis-test.controller';
import { RedisService } from './redis.service';

describe('RedisTestController', () => {
  let controller: RedisTestController;
  const redisServiceMock = {
    set: jest.fn<(...args: any[]) => Promise<void>>(),
    get: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new RedisTestController(redisServiceMock as unknown as RedisService);
  });

  it('saves user payload to redis', async () => {
    redisServiceMock.set.mockResolvedValue(undefined);
    const body = { name: 'A', role: 'user' };

    const result = await controller.saveUser('42', body);

    expect(redisServiceMock.set).toHaveBeenCalledWith(
      'user:42',
      JSON.stringify(body),
      60,
    );
    expect(result).toEqual({ success: true, message: 'Saved user 42 to Redis' });
  });

  it('returns not found when redis has no user data', async () => {
    redisServiceMock.get.mockResolvedValue(null);

    const result = await controller.getUser('7');

    expect(redisServiceMock.get).toHaveBeenCalledWith('user:7');
    expect(result).toEqual({ success: false, message: 'User not found in Redis' });
  });

  it('returns parsed user when redis has data', async () => {
    redisServiceMock.get.mockResolvedValue('{"name":"Lan","age":22}');

    const result = await controller.getUser('7');

    expect(result).toEqual({ success: true, user: { name: 'Lan', age: 22 } });
  });
});
