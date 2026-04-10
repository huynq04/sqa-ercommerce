import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '@modules/ecommerce/entities/productImage.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';
import {
  UpdateProductImageDto,
  UploadProductImageDto,
} from '@modules/ecommerce/dtos/upload-product-image.dto';

@Injectable()
export class AdminProductImageService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async addImage(dto: UploadProductImageDto) {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
      relations: ['images'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    if (dto.isMain) {
      // Reset ảnh chính cũ
      await this.imageRepo.update(
        { product: { id: dto.productId }, isMain: true },
        { isMain: false },
      );
      // Cập nhật mainImageUrl
      product.mainImageUrl = dto.imageUrl;
      await this.productRepo.save(product);
    }

    const newImg = this.imageRepo.create({
      product,
      imageUrl: dto.imageUrl,
      isMain: dto.isMain,
    });
    await this.imageRepo.save(newImg);

    return {
      message: dto.isMain
        ? 'Thêm thành công (ảnh chính, ảnh cũ đã chuyển thành phụ)'
        : 'Thêm thành công (ảnh phụ)',
      imageUrl: dto.imageUrl,
    };
  }

  async updateImage(id: number, dto: UpdateProductImageDto) {
    const image = await this.imageRepo.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!image) throw new NotFoundException('Không tìm thấy ảnh');

    const product = image.product;
    let message = 'Cập nhật ảnh thành công';

    if (dto.isMain !== undefined) {
      if (dto.isMain === true) {
        await this.imageRepo.update(
          { product: { id: product.id }, isMain: true },
          { isMain: false },
        );

        product.mainImageUrl = dto.imageUrl ?? image.imageUrl;
        await this.productRepo.save(product);

        image.isMain = true;
        message =
          'Ảnh này đã được đặt làm ảnh chính, ảnh cũ đã chuyển thành phụ';
      }

      if (dto.isMain === false && image.isMain) {
        image.isMain = false;
        product.mainImageUrl = null;

        const nextImage = await this.imageRepo.findOne({
          where: { product: { id: product.id }, isMain: false },
          order: { id: 'ASC' },
        });

        if (nextImage) {
          nextImage.isMain = true;
          await this.imageRepo.save(nextImage);
          product.mainImageUrl = nextImage.imageUrl;
          message =
            'Ảnh chính đã được hạ xuống ảnh phụ (ảnh khác đã thay thế làm ảnh chính)';
        } else {
          message =
            'Ảnh chính đã được hạ xuống ảnh phụ (hiện chưa có ảnh chính mới)';
        }

        await this.productRepo.save(product);
      }
    }

    if (dto.imageUrl) {
      image.imageUrl = dto.imageUrl;

      if (image.isMain) {
        product.mainImageUrl = dto.imageUrl;
        await this.productRepo.save(product);
      }
      message = 'Cập nhật link ảnh thành công';
    }
    await this.imageRepo.save(image);
    return {
      message,
      image,
    };
  }

  // async listByProduct(productId: number) {
  //     return this.imageRepo.find({
  //         where: { product: { id: productId } },
  //         order: { id: 'ASC' },
  //     });
  // }

  async deleteImage(id: number) {
    const image = await this.imageRepo.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!image) throw new NotFoundException('Không tìm thấy ảnh');

    const product = image.product;

    if (image.isMain) {
      product.mainImageUrl = null;
      const next = await this.imageRepo.findOne({
        where: { product: { id: product.id }, isMain: false },
        order: { id: 'ASC' },
      });
      if (next) {
        next.isMain = true;
        await this.imageRepo.save(next);
        product.mainImageUrl = next.imageUrl;
      }
      await this.productRepo.save(product);
    }

    await this.imageRepo.remove(image);

    return {
      message: image.isMain
        ? 'Đã xóa ảnh chính (ảnh khác đã thay thế nếu có)'
        : 'Đã xóa ảnh phụ',
    };
  }
}
