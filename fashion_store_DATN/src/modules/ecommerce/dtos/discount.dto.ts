import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateDiscountDto {
  @ApiProperty({ example: 'SALE50' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Giảm giá 50% cho đơn hàng đầu tiên',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  discountPercent: number;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ example: '2025-12-31' })
  @IsDateString()
  endDate: Date;

  @ApiProperty({ example: 100 })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;
}

export class UpdateDiscountDto {
  @ApiProperty({ example: 'SALE50', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    example: 'Giảm giá 50% cho đơn hàng đầu tiên',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiProperty({ example: '2025-01-01', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;
}

export class ApplyDiscountDto {
  @ApiProperty({ example: 'SALE50' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  totalAmount: number;
}
