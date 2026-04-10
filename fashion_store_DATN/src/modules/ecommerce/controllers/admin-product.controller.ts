import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  CreateProductColorDto,
  CreateProductDto,
  CreateProductSizeDto,
  CreateProductVariantDto,
  UpdateProductColorDto,
  UpdateProductDto,
  UpdateProductSizeDto,
  UpdateProductVariantDto,
} from '@modules/ecommerce/dtos/product.dto';
import {AuthGuard} from '@modules/auth/auth.guard';
import {RolesGuard} from '@modules/auth/roles.guard';
import {Roles} from '@modules/auth/roles.decorator';
import {Role} from '@modules/auth/role.enum';
import {ApiBearerAuth, ApiOperation, ApiTags} from '@nestjs/swagger';
import {AdminProductService} from '@modules/ecommerce/services/admin-product.service';
import {AdminProductVariantService} from '@modules/ecommerce/services/admin-product-variant.service';
import {AdminProductSizeService} from '@modules/ecommerce/services/admin-product-size.service';
import {AdminProductColorService} from '@modules/ecommerce/services/admin-product-color.service';
import {AdminProductImageService} from '@modules/ecommerce/services/admin-product-image.service';
import {UpdateProductImageDto, UploadProductImageDto,} from '@modules/ecommerce/dtos/upload-product-image.dto';

@ApiTags('Admin/Products')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/products')
export class AdminProductController {
  constructor(private readonly productService: AdminProductService) {}

  /** Admin – Tạo sản phẩm */
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('create')
  async create(@Body(new ValidationPipe()) dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  /** Admin – Cập nhật sản phẩm */
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch('update')
  async update(@Body(new ValidationPipe()) dto: UpdateProductDto) {
    return this.productService.update(dto);
  }

  /** Admin – Xóa sản phẩm */
  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.productService.delete(id);
    return { message: 'Đã xóa sản phẩm thành công' };
  }
}

@ApiTags('Admin/Product Variants')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/product-variants')
export class AdminProductVariantController {
  constructor(private readonly variantService: AdminProductVariantService) {}

  /** Admin – Tạo biến thể sản phẩm */
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('create')
  async create(@Body(new ValidationPipe()) dto: CreateProductVariantDto) {
    return this.variantService.create(dto);
  }

  /** Admin – Cập nhật biến thể */
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch('update')
  async update(@Body(new ValidationPipe()) dto: UpdateProductVariantDto) {
    return this.variantService.update(dto);
  }

  /** Admin – Xóa biến thể */
  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.variantService.delete(id);
    return { message: 'Đã xóa biến thể thành công' };
  }
}

@ApiTags('Admin/Product Colors')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/product-colors')
export class AdminProductColorController {
  constructor(private readonly colorService: AdminProductColorService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  async findAll() {
    return this.colorService.findAll();
  }

  /** Admin – Tạo màu */
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('create')
  async create(@Body(new ValidationPipe()) dto: CreateProductColorDto) {
    return this.colorService.create(dto);
  }

  /** Admin – Cập nhật màu */
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch('update')
  async update(@Body(new ValidationPipe()) dto: UpdateProductColorDto) {
    return this.colorService.update(dto);
  }

  /** Admin – Xóa màu */
  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.colorService.delete(id);
    return { message: 'Đã xóa màu thành công' };
  }
}

@ApiTags('Admin/Product Sizes')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/product-sizes')
export class AdminProductSizeController {
  constructor(private readonly sizeService: AdminProductSizeService) {}

  /** Admin – Lấy tất cả size */
  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  async findAll() {
    return this.sizeService.findAll();
  }

  /** Admin – Tạo size */
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('create')
  async create(@Body(new ValidationPipe()) dto: CreateProductSizeDto) {
    return this.sizeService.create(dto);
  }

  /** Admin – Cập nhật size */
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch('update')
  async update(@Body(new ValidationPipe()) dto: UpdateProductSizeDto) {
    return this.sizeService.update(dto);
  }

  /** Admin – Xóa size */
  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.sizeService.delete(id);
    return { message: 'Đã xóa size thành công' };
  }
}

@ApiTags('Admin/Product Images')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/product-images')
export class AdminProductImageController {
  constructor(private readonly imageService: AdminProductImageService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Post('upload')
  @ApiOperation({ summary: 'Thêm ảnh sản phẩm (FE đã upload file trước)' })
  async upload(@Body(new ValidationPipe()) dto: UploadProductImageDto) {
    return this.imageService.addImage(dto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật ảnh (đặt làm ảnh chính hoặc đổi link)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe()) dto: UpdateProductImageDto,
  ) {
    return this.imageService.updateImage(id, dto);
  }

  // @Roles(Role.ADMIN)
  // @Get(':productId')
  // @ApiOperation({ summary: 'Danh sách ảnh theo sản phẩm' })
  // async list(@Param('productId', ParseIntPipe) productId: number) {
  //     return this.imageService.listByProduct(productId);
  // }

  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa ảnh (tự cập nhật lại ảnh chính nếu cần)' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.imageService.deleteImage(id);
  }
}
