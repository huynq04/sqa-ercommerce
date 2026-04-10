import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@modules/auth/auth.guard';
import { UserOrderService } from '../services/user-order.service';
import { CreateOrderDto, BuyNowDto } from '../dtos/order.dto';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';

@ApiTags('User/Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('orders')
export class UserOrderController {
  constructor(private readonly orderService: UserOrderService) {}

  @Post('buy-now')
  buyNow(@Req() req, @Body() dto: BuyNowDto) {
    return this.orderService.buyNow(req.user.sub, dto);
  }

  @Post('from-cart')
  fromCart(@Req() req, @Body() dto: CreateOrderDto) {
    return this.orderService.fromCart(req.user.sub, dto);
  }

  @Get()
  getOrders(@Req() req, @Query() query: QuerySpecificationDto) {
    return this.orderService.listUserOrders(req.user.sub, query);
  }

  @Get(':id/commentable')
  async commentable(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.orderService.getOrderCommentStatus(req.user.sub, id);
  }

  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.orderService.getOrderDetail(req.user.sub, id);
  }

  @Get(':id/tracking')
  async trackOrder(@Param('id', ParseIntPipe) orderId: number, @Req() req) {
    return this.orderService.getOrderTracking(req.user.sub, orderId);
  }
}
