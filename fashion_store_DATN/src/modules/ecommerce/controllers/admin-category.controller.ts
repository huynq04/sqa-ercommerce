import {Body, Controller, Delete, Param, ParseIntPipe, Patch, Post, UseGuards, ValidationPipe,} from '@nestjs/common';
import {Roles} from '@modules/auth/roles.decorator';
import {Role} from '@modules/auth/role.enum';
import {RolesGuard} from '@modules/auth/roles.guard';
import {AuthGuard} from '@modules/auth/auth.guard';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {CreateCategoryDto, UpdateCategoryDto,} from '@modules/ecommerce/dtos/category.dto';
import {AdminCategoryService} from '@modules/ecommerce/services/admin-category.service';

@ApiTags('Admin/Categories')
@Controller('admin/categories')
@UseGuards(AuthGuard, RolesGuard)
export class AdminCategoryController {
  constructor(private readonly categoryService: AdminCategoryService) {}

  /** Admin – Tạo danh mục */
  @ApiBearerAuth()
  @Post('create')
  @Roles(Role.ADMIN, Role.STAFF)
  async create(@Body(new ValidationPipe()) dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  /** Admin – Cập nhật danh mục */
  @ApiBearerAuth()
  @Patch('update')
  @Roles(Role.ADMIN, Role.STAFF)
  async update(@Body(new ValidationPipe()) dto: UpdateCategoryDto) {
    return this.categoryService.update(dto);
  }

  /** Admin – Xóa danh mục */
  @ApiBearerAuth()
  @Delete(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.delete(id);
    return { message: 'Đã xóa danh mục thành công' };
  }
}
