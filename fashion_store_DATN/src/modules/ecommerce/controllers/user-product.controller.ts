import { Controller, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserProductService } from '@modules/ecommerce/services/user-product.service';
import { PaginatedResult } from '@base/dtos/paginated-result.dto';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '@modules/auth/constants';

@ApiTags('User/Products')
@Controller('products')
export class UserProductController {
  constructor(
    private readonly productService: UserProductService,
    private readonly jwtService: JwtService,
  ) {}

  /** Lấy danh sách sản phẩm */
  @Get()
  @ApiOkResponse({ type: PaginatedResult<Product> })
  async getAll(@Query() query: QuerySpecificationDto) {
    return this.productService.findAll(query);
  }

  /** Lấy chi tiết sản phẩm */
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const product = await this.productService.findById(id);

    const userId = this.extractUserId(req);
    if (userId) {
      this.productService.logProductView(userId, id).catch(() => undefined);
    }

    return product;
  }

  private extractUserId(req: Request): number | null {
    // Prefer Authorization header, fallback to cookie "token"
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader) {
      const [type, raw] = authHeader.split(' ');
      if (type === 'Bearer' && raw) token = raw;
    }

    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').map((c) => c.trim());
      const tokenPair = cookies.find((c) => c.startsWith('token='));
      if (tokenPair) token = tokenPair.split('=')[1];
    }

    if (!token) return null;

    try {
      const payload = this.jwtService.verify(token, { secret: jwtConstants.secret });
      const rawId = (payload as any)?.sub ?? (payload as any)?.id;
      const parsed = typeof rawId === 'number' ? rawId : Number(rawId);
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}
