import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateProductReviewDto {
  @IsInt()
  orderItemId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MaxLength(2000)
  comment: string;
}

export class SellerReplyReviewDto {
  @IsString()
  @MaxLength(2000)
  reply: string;
}
