import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { RedisService } from './redis.service';
import { config } from '@config';
import { RedisTestController } from '@base/db/redis/redis-test.controller';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      // isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        host: config.REDIS.HOST,
        port: config.REDIS.PORT,
        ttl: 3000, // TTL mặc định (giây)
        // isGlobal: true,
      }),
    }),
  ],
  controllers: [RedisTestController],
  providers: [RedisService],
  exports: [RedisService, CacheModule],
})
export class RedisCacheModule {}
