import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadProductImageDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsNotEmpty()
  productId: number;

  @ApiProperty({
    description: 'Đường dẫn ảnh ',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ description: 'Có đặt làm ảnh chính không', default: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isMain: boolean;
}

export class UpdateProductImageDto {
  @ApiPropertyOptional({ description: 'Có đặt làm ảnh chính không' })
  @Transform(
    ({ value }) => value === 'true' || value === true || value === 'True',
  )
  @IsBoolean()
  @IsOptional()
  isMain?: boolean;

  @ApiPropertyOptional({ description: 'Đường dẫn ảnh mới' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
