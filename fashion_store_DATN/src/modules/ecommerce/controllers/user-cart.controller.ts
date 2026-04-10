import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserCartService } from '../services/user-cart.service';
import { AddToCartDto, UpdateCartDto } from '../dtos/cart.dto';
import { AuthGuard } from '@modules/auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('User/Cart')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('cart')
export class UserCartController {
  constructor(private readonly cartService: UserCartService) {}

  @Get()
  getCart(@Req() req) {
    return this.cartService.getUserCart(req.user.sub);
  }

  @Post('add')
  add(@Req() req, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(req.user.sub, dto);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateCartDto) {
    return this.cartService.updateItem(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.cartService.removeItem(id);
  }

  @Delete()
  clear(@Req() req) {
    return this.cartService.clearCart(req.user.sub);
  }
}
