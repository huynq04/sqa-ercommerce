import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import { GhnService } from './ghn.service';
import {
  CreateShippingOrderDto,
  CalculateShippingFeeDto,
  CancelShippingOrderDto,
  UpdateCodDto,
} from './dto/ghn.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('GHN')
@Controller('shipping/ghn')
export class GhnController {
  constructor(private readonly ghnService: GhnService) {}

  @Post('create-order')
  @ApiOperation({ summary: 'Tạo đơn hàng giao hàng nhanh' })
  async createShippingOrder(@Body() dto: CreateShippingOrderDto) {
    return await this.ghnService.createShippingOrder(dto);
  }

  @Post('calculate-fee')
  @ApiOperation({ summary: 'Tính phí vận chuyển' })
  async calculateShippingFee(@Body() dto: CalculateShippingFeeDto) {
    return await this.ghnService.calculateShippingFee(dto);
  }

  @Delete('cancel-order')
  @ApiOperation({ summary: 'Hủy đơn hàng giao hàng' })
  async cancelShippingOrder(@Body() dto: CancelShippingOrderDto) {
    return await this.ghnService.cancelShippingOrder(dto.orderCode);
  }

  @Get('order/:orderCode')
  @ApiOperation({ summary: 'Lấy thông tin đơn hàng' })
  async getOrderInfo(@Param('orderCode') orderCode: string) {
    return await this.ghnService.getOrderInfo(orderCode);
  }

  @Get('provinces')
  @ApiOperation({ summary: 'Lấy danh sách tỉnh/thành phố' })
  async getProvinces() {
    return await this.ghnService.getProvinces();
  }

  @Get('districts')
  @ApiOperation({ summary: 'Lấy danh sách quận/huyện' })
  async getDistricts(@Query('provinceId') provinceId: number) {
    return await this.ghnService.getDistricts(provinceId);
  }

  @Get('wards')
  @ApiOperation({ summary: 'Lấy danh sách phường/xã' })
  async getWards(@Query('districtId') districtId: number) {
    return await this.ghnService.getWards(districtId);
  }

  @Get('shift-date')
  @ApiOperation({ summary: 'Lấy ca giao hàng' })
  async getShiftDate() {
    return await this.ghnService.getShiftDate();
  }

  @Post('update-Cod')
  @ApiOperation({ summary: 'Cập nhật tiền cod' })
  async updateCod(@Body() dto: UpdateCodDto) {
    return await this.ghnService.updateCod(dto);
  }
}

