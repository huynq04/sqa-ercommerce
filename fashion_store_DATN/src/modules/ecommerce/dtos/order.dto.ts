import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { PaymentMethod } from '@modules/ecommerce/entities/order.entity';

export class CreateOrderDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  shippingAddress: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingFee?: number;

  @IsOptional()
  @IsString()
  discountCode?: string;
}

export class BuyNowDto extends CreateOrderDto {
  @IsOptional()
  @IsInt()
  variantId?: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}
