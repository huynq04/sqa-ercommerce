import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserDiscountService } from '../services/user-discount.service';
import { ApplyDiscountDto } from '../dtos/discount.dto';

@ApiTags('User/Discounts')
@Controller('discounts')
export class UserDiscountController {
  constructor(private readonly discountService: UserDiscountService) {}

  // @Get()
  // getActive() {
  //     return this.discountService.getActiveDiscounts();
  // }

  @Get()
  getAll() {
    return this.discountService.getAllDiscounts();
  }

  @Post('apply')
  apply(@Body() dto: ApplyDiscountDto) {
    return this.discountService.applyDiscount(dto);
  }
}
