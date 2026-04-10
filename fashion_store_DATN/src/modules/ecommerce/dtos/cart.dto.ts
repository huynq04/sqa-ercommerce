import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class AddToCartDto {
  @IsOptional()
  @IsInt()
  variantId?: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}

export class UpdateCartDto {
  @IsInt()
  @IsPositive()
  quantity: number;
}
