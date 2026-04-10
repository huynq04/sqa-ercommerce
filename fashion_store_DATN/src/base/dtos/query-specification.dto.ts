import 'reflect-metadata';
import { applyDecorators } from '@nestjs/common';
import {
  ApiHideProperty,
  ApiPropertyOptional,
  IntersectionType,
  PickType,
} from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { config } from '@config/config.service';

// "id,-createdAt"  ->  { id: 1, createdAt: -1 }
function parseSort(
  input?: string | Record<string, any>,
): Record<string, 1 | -1> | undefined {
  if (!input) return undefined;

  if (typeof input === 'object') {
    const out: Record<string, 1 | -1> = {};
    Object.entries(input).forEach(([k, v]) => {
      const dir = `${v}`.startsWith('-')
        ? -1
        : `${v}`.startsWith('1')
          ? 1
          : Number(v) === -1
            ? -1
            : 1;
      out[k] = dir as 1 | -1;
    });
    return out;
  }

  // string: "fieldA,-fieldB,createdAt"
  const parts = `${input}`
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const sortObj: Record<string, 1 | -1> = {};
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('-')) sortObj[part.slice(1)] = -1;
    else if (part.startsWith('+')) sortObj[part.slice(1)] = 1;
    else sortObj[part] = 1;
  }
  return Object.keys(sortObj).length ? sortObj : undefined;
}

// Decorator để auto-transform query.sort
export function TransformSort() {
  return applyDecorators(
    Transform(({ value }) => parseSort(value), { toClassOnly: true }),
  );
}

// Transform number safe với default
function toNumber(value: any, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export class PaginationSpecificationDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = config.PAGINATION_PAGE_SIZE ?? 10;
}

// Dùng lại page/limit + helper getSkip
export class PaginationDto extends PickType(PaginationSpecificationDto, [
  'limit',
  'page',
] as const) {
  // eslint-disable-next-line @typescript-eslint/typedef
  static readonly getSkip = (query?: Partial<PaginationSpecificationDto>) => {
    const page = toNumber(query?.page, 1);
    const limit = toNumber(query?.limit, config.PAGINATION_PAGE_SIZE);
    return (page - 1) * limit;
  };
}

export class SortSpecificationDto {
  @ApiPropertyOptional({
    type: String,
    example: 'id,-createdAt',
    description: 'Sắp xếp: "fieldA,-fieldB" (ASC mặc định, dấu "-" là DESC)',
  })
  @IsOptional()
  @TransformSort()
  @IsObject()
  sort?: Record<string, 1 | -1>;
}

// SEARCH
export class SearchSpecificationDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm', example: 'áo thun' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  searchFields?: string[];
}

export class QuerySpecificationDto<
  TFilter = Record<string, any>,
> extends IntersectionType(
  PaginationDto,
  IntersectionType(SortSpecificationDto, SearchSpecificationDto),
) {
  @ApiPropertyOptional({
    description: 'Bộ lọc dạng object. Ví dụ: filter[categoryId]=3',
    type: Object,
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  filter?: TFilter;
}
