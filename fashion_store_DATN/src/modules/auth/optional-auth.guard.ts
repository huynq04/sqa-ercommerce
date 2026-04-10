import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Cache } from 'cache-manager';
import { jwtConstants } from './constants';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    //KHÔNG CÓ TOKEN → guest → cho qua
    if (!token) {
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      const redisKey = `userToken:${payload.sub}`;
      const cachedToken = await this.cacheManager.get<string>(redisKey);

      if (!cachedToken || cachedToken !== token) {
        return true; // token sai → coi như guest
      }

      // Có token hợp lệ → gắn user
      request['user'] = payload;

      return true;
    } catch {
      return true; // lỗi token → coi như guest
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
