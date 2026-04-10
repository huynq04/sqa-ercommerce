import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  private getClient(): any {
    const store: any = (this.cacheManager as any).store;
    if (store?.getClient) return store.getClient();
    if (store?.client) return store.client;
    return null;
  }
  /**
   * Set value vào Redis
   * @param key khóa
   * @param value giá trị
   * @param ttlSeconds thời gian sống (giây)
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.cacheManager.set(key, value, ttlSeconds); // TTL là number
    } else {
      await this.cacheManager.set(key, value);
    }
  }

  async setNx(
    key: string,
    value: number,
    ttlSeconds?: number,
  ): Promise<number | boolean> {
    const client = this.getClient();
    if (!client?.pipeline) {
      const existing = await this.get(key);
      if (existing !== null && existing !== undefined) return false;
      await this.set(key, value, ttlSeconds);
      return true;
    }

    const exp = ttlSeconds ?? 0;
    const res = await client
      .pipeline()
      .setnx(key, value)
      .expire(key, exp)
      .exec();
    return res?.shift()?.[1];
  }

  async incrBy(key: string, delta: number): Promise<number> {
    const client = this.getClient();
    if (client?.incrby) return client.incrby(key, delta);
    if (client?.incrBy) return client.incrBy(key, delta);
    const current = await this.get<number>(key);
    const next = (current ?? 0) + delta;
    await this.set(key, next);
    return next;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const client = this.getClient();
    if (client?.expire) {
      await client.expire(key, ttlSeconds);
      return;
    }
    const value = await this.get(key);
    if (value !== null && value !== undefined) {
      await this.set(key, value, ttlSeconds);
    }
  }

  /**
   * Lấy value từ Redis
   */
  async get<T>(key: string): Promise<T | null> {
    return (await this.cacheManager.get(key)) as T;
  }

  /**
   * Xóa key khỏi Redis
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Reset toàn bộ cache (tùy vào store có hỗ trợ hay không)
   */
  async reset(): Promise<void> {
    const store: any = (this.cacheManager as any).store;
    if (store.reset) {
      await store.reset();
    }
  }
}
