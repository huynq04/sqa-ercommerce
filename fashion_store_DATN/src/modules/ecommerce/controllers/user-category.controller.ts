import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserCategoryService } from '@modules/ecommerce/services/user-category.service';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';

@ApiTags('User/Categories')
@Controller('categories')
export class UserCategoryController {
  constructor(private readonly categoryService: UserCategoryService) {}

  @Get()
  async getAll(@Query() query: QuerySpecificationDto) {
    return this.categoryService.findAll(query);
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findById(id);
  }
}
