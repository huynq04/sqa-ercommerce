import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  Max,
  IsInt,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsOptional()
  @IsString()
  mainImageUrl?: string;
}

export class UpdateProductDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsString()
  mainImageUrl?: string;
}

export class CreateProductVariantDto {
  @IsInt()
  productId: number;

  @IsOptional()
  @IsInt()
  sizeId?: number;

  @IsOptional()
  @IsInt()
  colorId?: number;

  @IsString()
  sku: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsInt()
  stock: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateProductVariantDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsInt()
  productId?: number;

  @IsOptional()
  @IsInt()
  sizeId?: number;

  @IsOptional()
  @IsInt()
  colorId?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsInt()
  stock?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateProductColorDto {
  @IsString()
  color: string;
}

export class UpdateProductColorDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateProductSizeDto {
  @IsString()
  size: string;
}

export class UpdateProductSizeDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  size?: string;
}
