import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { Category } from '@modules/ecommerce/entities/category.entity';
import {
  CreateProductDto,
  UpdateProductDto,
} from '@modules/ecommerce/dtos/product.dto';
import { ProductImage } from '@modules/ecommerce/entities/productImage.entity';
import {ProductVariant} from "@modules/ecommerce/entities/productVariant.entity";
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';

@Injectable()
export class AdminProductService {
  constructor(
      @InjectRepository(Product)
      private readonly productRepo: Repository<Product>,
      @InjectRepository(Category)
      private readonly categoryRepo: Repository<Category>,
      @InjectRepository(ProductImage)
      private readonly productImageRepo: Repository<ProductImage>,
      @InjectRepository(ProductVariant)
      private readonly productVariantRepo: Repository<ProductVariant>,
      @InjectRepository(OrderItem)
      private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  /** Tạo sản phẩm mới */
  async create(dto: CreateProductDto): Promise<Product> {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');

    //  Tạo sản phẩm
    const product = this.productRepo.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      discount: dto.discount ?? 0,
      stock: dto.stock ?? 0,
      mainImageUrl: dto.mainImageUrl ?? null,
      category,
    });

    const savedProduct = await this.productRepo.save(product);

    //  Nếu có ảnh chính → thêm record vào bảng product_images
    if (dto.mainImageUrl) {
      await this.productImageRepo.save(
          this.productImageRepo.create({
            product: { id: savedProduct.id },
            imageUrl: dto.mainImageUrl,
            isMain: true,
          }),
      );
    }

    return savedProduct;
  }

  /** Cập nhật sản phẩm */
  async update(dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: dto.id },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Danh mục không tồn tại');
      product.category = category;
    }
    if (dto.mainImageUrl && dto.mainImageUrl !== product.mainImageUrl) {
      // Bỏ ảnh chính cũ
      await this.productImageRepo.update(
          { product: { id: product.id }, isMain: true },
          { isMain: false },
      );

      // Thêm ảnh mới làm ảnh chính vào bảng product_images
      await this.productImageRepo.save(
          this.productImageRepo.create({
            product: { id: product.id },
            imageUrl: dto.mainImageUrl,
            isMain: true,
          }),
      );
    }

    Object.assign(product, {
      name: dto.name ?? product.name,
      description: dto.description ?? product.description,
      price: dto.price ?? product.price,
      discount: dto.discount ?? product.discount,
      stock: dto.stock ?? product.stock,
      mainImageUrl: dto.mainImageUrl ?? product.mainImageUrl,
    });

    return this.productRepo.save(product);
  }

  /** Xóa sản phẩm */
  async delete(id: number): Promise<void> {
    const usedInOrders = await this.orderItemRepo
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.variant', 'variant')
      .where('variant.product_id = :id', { id })
      .getCount();
    if (usedInOrders > 0) {
      throw new BadRequestException(
        'Sản phẩm đã có đơn hàng nên không thể xóa.',
      );
    }
    // Xóa ảnh trước
    await this.productImageRepo.delete({ product: { id } });

    // Xóa biến thể trước
    await this.productVariantRepo.delete({ product: { id } });

    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    await this.productRepo.remove(product);
  }
}
