import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { jwtConstants } from './constants';
import { IS_PUBLIC_KEY } from './public.decorator';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Kiểm tra route có public không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token không tồn tại.');
    }

    try {
      // ✅ Xác thực chữ ký và giải mã token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      // ✅ Kiểm tra token trong Redis
      const redisKey = `userToken:${payload.sub}`;
      const cachedToken = await this.cacheManager.get<string>(redisKey);

      if (!cachedToken || cachedToken !== token) {
        throw new UnauthorizedException('Token đã hết hạn hoặc bị thu hồi.');
      }

      // ✅ Gắn thông tin user vào request để controller có thể dùng
      request['user'] = payload;

      return true;
    } catch (err) {
      console.error('Lỗi xác thực token:', err.message);
      throw new UnauthorizedException('Token không hợp lệ.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
