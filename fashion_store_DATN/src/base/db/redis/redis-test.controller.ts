import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisTestController {
  constructor(private readonly redisService: RedisService) {}
  // ✅ Lưu user vào Redis
  @Post('save-user/:id')
  async saveUser(@Param('id') id: string, @Body() body: any) {
    const key = `user:${id}`;
    await this.redisService.set(key, JSON.stringify(body), 60); // TTL 60s
    return { success: true, message: `Saved user ${id} to Redis` };
  }

  // ✅ Lấy user từ Redis
  @Get('get-user/:id')
  async getUser(@Param('id') id: string) {
    const key = `user:${id}`;
    const data = await this.redisService.get<string>(key);
    if (!data) return { success: false, message: 'User not found in Redis' };
    return { success: true, user: JSON.parse(data) };
  }
}
