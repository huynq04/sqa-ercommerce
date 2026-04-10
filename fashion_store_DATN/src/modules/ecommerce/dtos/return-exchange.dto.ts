import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReturnDto {
  @IsNumber()
  orderItemId: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  images?: string[];
}

export class ReasonDto {
  @IsString()
  reason: string;
}
