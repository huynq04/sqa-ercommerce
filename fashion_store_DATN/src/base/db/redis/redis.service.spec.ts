import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let cacheManager: {
    set: jest.Mock<any>;
    get: jest.Mock<any>;
    del: jest.Mock<any>;
    store: Record<string, any>;
  };

  beforeEach(() => {
    cacheManager = {
      set: jest.fn(async () => undefined),
      get: jest.fn(async () => null),
      del: jest.fn(async () => undefined),
      store: {},
    };

    service = new RedisService(cacheManager as any);
  });

  it('set stores value with ttl when provided', async () => {
    await service.set('k', 10, 30);

    expect(cacheManager.set).toHaveBeenCalledWith('k', 10, 30);
  });

  it('set stores value without ttl when not provided', async () => {
    await service.set('k', 10);

    expect(cacheManager.set).toHaveBeenCalledWith('k', 10);
  });

  it('setNx uses get/set fallback when store has no pipeline', async () => {
    cacheManager.get.mockResolvedValue(undefined);

    const result = await service.setNx('counter', 1, 20);

    expect(cacheManager.get).toHaveBeenCalledWith('counter');
    expect(cacheManager.set).toHaveBeenCalledWith('counter', 1, 20);
    expect(result).toBe(true);
  });

  it('setNx fallback returns false if key already exists', async () => {
    cacheManager.get.mockResolvedValue(9);

    const result = await service.setNx('counter', 1, 20);

    expect(cacheManager.set).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('setNx uses redis pipeline when available', async () => {
    const exec = jest.fn(async () => [[null, 1], [null, 1]]);
    const expire = jest.fn(() => ({ exec }));
    const setnx = jest.fn(() => ({ expire }));
    const pipeline = jest.fn(() => ({ setnx }));
    cacheManager.store = { getClient: () => ({ pipeline }) };

    const result = await service.setNx('counter', 1, 50);

    expect(pipeline).toHaveBeenCalledTimes(1);
    expect(setnx).toHaveBeenCalledWith('counter', 1);
    expect(expire).toHaveBeenCalledWith('counter', 50);
    expect(result).toBe(1);
  });

  it('incrBy uses client.incrby when available', async () => {
    const incrby = jest.fn(async () => 5);
    cacheManager.store = { getClient: () => ({ incrby }) };

    const result = await service.incrBy('counter', 2);

    expect(result).toBe(5);
    expect(incrby).toHaveBeenCalledWith('counter', 2);
  });

  it('incrBy uses client.incrBy when available', async () => {
    const incrBy = jest.fn(async () => 8);
    cacheManager.store = { getClient: () => ({ incrBy }) };

    const result = await service.incrBy('counter', 3);

    expect(result).toBe(8);
    expect(incrBy).toHaveBeenCalledWith('counter', 3);
  });

  it('incrBy falls back to get/set when client increment is unavailable', async () => {
    cacheManager.get.mockResolvedValue(4);

    const result = await service.incrBy('counter', 6);

    expect(cacheManager.get).toHaveBeenCalledWith('counter');
    expect(cacheManager.set).toHaveBeenCalledWith('counter', 10);
    expect(result).toBe(10);
  });

  it('expire uses client.expire when available', async () => {
    const expire = jest.fn(async () => undefined);
    cacheManager.store = { getClient: () => ({ expire }) };

    await service.expire('k', 20);

    expect(expire).toHaveBeenCalledWith('k', 20);
    expect(cacheManager.set).not.toHaveBeenCalled();
  });

  it('expire falls back to set when key exists and no client expire', async () => {
    cacheManager.get.mockResolvedValue({ ok: true });

    await service.expire('k', 40);

    expect(cacheManager.set).toHaveBeenCalledWith('k', { ok: true }, 40);
  });

  it('get and del delegate to cache manager', async () => {
    cacheManager.get.mockResolvedValue('value');

    const value = await service.get<string>('k');
    await service.del('k');

    expect(value).toBe('value');
    expect(cacheManager.del).toHaveBeenCalledWith('k');
  });

  it('reset calls store.reset when available', async () => {
    const reset = jest.fn(async () => undefined);
    cacheManager.store = { reset };

    await service.reset();

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
