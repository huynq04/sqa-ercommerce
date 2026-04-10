import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ShippingItemCategoryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  level1?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  level2?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  level3?: string;
}

export class ShippingOrderItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  length?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({ required: false, type: () => ShippingItemCategoryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingItemCategoryDto)
  category?: ShippingItemCategoryDto;
}

export class CreateShippingOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  orderId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  toName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  toPhone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  toAddress: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  toWardCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  toDistrictId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  toProvinceName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  codAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  length?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  serviceId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  serviceTypeId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  insuranceValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  pickStationId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  deliverStationId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coupon?: string | null;

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  pickShift?: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clientOrderCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  returnPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  returnAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  returnDistrictId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  returnWardCode?: string;

  @ApiProperty({ required: false, type: () => [ShippingOrderItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ShippingOrderItemDto)
  items?: ShippingOrderItemDto[];
}

export class CalculateShippingFeeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  toDistrictId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  toWardCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  weight: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  length?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  codAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  fromDistrictId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fromWardCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  serviceId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  serviceTypeId?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  insuranceValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  codFailedAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coupon?: string | null;

  @ApiProperty({ required: false, type: () => [ShippingOrderItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ShippingOrderItemDto)
  items?: ShippingOrderItemDto[];
}

export class CancelShippingOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  orderCode: string;
}

export class UpdateCodDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  orderCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  codAmount: number;
}
