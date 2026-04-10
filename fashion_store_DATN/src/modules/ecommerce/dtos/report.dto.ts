import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';
import {Transform, Type} from 'class-transformer';

export class ReportFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class BestSellerFilterDto extends ReportFilterDto {
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
