import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminDiscountService } from '../services/admin-discount.service';
import { CreateDiscountDto, UpdateDiscountDto } from '../dtos/discount.dto';

@ApiTags('Admin/Discounts')
@Controller('admin/discounts')
export class AdminDiscountController {
  constructor(private readonly discountService: AdminDiscountService) {}

  @Get()
  findAll() {
    return this.discountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.discountService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDiscountDto) {
    return this.discountService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateDiscountDto) {
    return this.discountService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.discountService.remove(id);
  }
}
