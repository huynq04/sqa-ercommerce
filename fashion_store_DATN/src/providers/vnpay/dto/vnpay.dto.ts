import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty()
  // @IsString()
  @IsNotEmpty()
  @IsNumber()
  orderId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  orderInfo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiProperty({ required: false, enum: ['vn', 'en'] })
  @IsOptional()
  @IsString()
  locale?: 'vn' | 'en';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankCode?: string;
}
