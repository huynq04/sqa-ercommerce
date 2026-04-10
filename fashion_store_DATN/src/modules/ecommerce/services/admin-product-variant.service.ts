import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { ProductSize } from '@modules/ecommerce/entities/productSize.entity';
import { ProductColor } from '@modules/ecommerce/entities/productColor.entity';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import {
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from '@modules/ecommerce/dtos/product.dto';

@Injectable()
export class AdminProductVariantService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductSize)
    private readonly sizeRepo: Repository<ProductSize>,
    @InjectRepository(ProductColor)
    private readonly colorRepo: Repository<ProductColor>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  private async syncProductStock(productId: number): Promise<void> {
    const result = await this.variantRepo
      .createQueryBuilder('variant')
      .select('COALESCE(SUM(variant.stock), 0)', 'total')
      .where('variant.product_id = :productId', { productId })
      .getRawOne<{ total: string }>();
    const totalStock = Number(result?.total ?? 0);
    await this.productRepo.update({ id: productId }, { stock: totalStock });
  }

  /** Tạo biến thể mới cho sản phẩm */
  async create(dto: CreateProductVariantDto): Promise<ProductVariant> {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    // Kiểm tra trùng biến thể (theo product + size + color)
    const duplicateVariant = await this.variantRepo.findOne({
      where: [
        {
          product: { id: dto.productId },
          size: dto.sizeId ? { id: dto.sizeId } : null,
          color: dto.colorId ? { id: dto.colorId } : null,
        },
      ],
      relations: ['product', 'size', 'color'],
    });

    if (duplicateVariant) {
      throw new BadRequestException(
        `Biến thể cùng size và màu đã tồn tại cho sản phẩm này.`,
      );
    }

    const size = dto.sizeId
      ? await this.sizeRepo.findOneBy({ id: dto.sizeId })
      : null;
    const color = dto.colorId
      ? await this.colorRepo.findOneBy({ id: dto.colorId })
      : null;

    const variant = this.variantRepo.create({
      product,
      size,
      color,
      sku: dto.sku,
      price: dto.price,
      stock: dto.stock,
      imageUrl: dto.imageUrl,
    });

    const savedVariant = await this.variantRepo.save(variant);
    await this.syncProductStock(product.id);
    return savedVariant;
  }

  /** Cập nhật biến thể */
  async update(dto: UpdateProductVariantDto): Promise<ProductVariant> {
    const variant = await this.variantRepo.findOne({
      where: { id: dto.id },
      relations: ['product'],
    });
    if (!variant) throw new NotFoundException('Không tìm thấy biến thể');

    const product = variant.product;
    const previousProductId = product.id;

    // Nếu có thay đổi product/size/color thì kiểm tra trùng
    const targetProductId = dto.productId ?? product.id;
    const targetSizeId = dto.sizeId ?? variant.size?.id;
    const targetColorId = dto.colorId ?? variant.color?.id;

    const duplicate = await this.variantRepo.findOne({
      where: {
        product: { id: targetProductId },
        size: targetSizeId ? { id: targetSizeId } : null,
        color: targetColorId ? { id: targetColorId } : null,
      },
      relations: ['product', 'size', 'color'],
    });

    if (duplicate && duplicate.id !== variant.id) {
      throw new BadRequestException(
        `Đã tồn tại biến thể cùng kích cỡ và màu sắc cho sản phẩm này.`,
      );
    }

    //  Cập nhật các trường
    Object.assign(variant, {
      sku: dto.sku ?? variant.sku,
      price: dto.price ?? variant.price,
      stock: dto.stock ?? variant.stock,
      imageUrl: dto.imageUrl ?? variant.imageUrl,
    });

    if (dto.productId && dto.productId !== variant.product.id) {
      const newProduct = await this.productRepo.findOneBy({
        id: dto.productId,
      });
      if (!newProduct)
        throw new NotFoundException('Không tìm thấy sản phẩm mới');
      variant.product = newProduct;
    }

    if (dto.sizeId && dto.sizeId !== variant.size?.id) {
      const newSize = await this.sizeRepo.findOneBy({ id: dto.sizeId });
      if (!newSize) throw new NotFoundException('Không tìm thấy kích cỡ mới');
      variant.size = newSize;
    }

    if (dto.colorId && dto.colorId !== variant.color?.id) {
      const newColor = await this.colorRepo.findOneBy({ id: dto.colorId });
      if (!newColor) throw new NotFoundException('Không tìm thấy màu mới');
      variant.color = newColor;
    }

    const savedVariant = await this.variantRepo.save(variant);
    const newProductId = dto.productId ?? previousProductId;
    if (newProductId !== previousProductId) {
      await this.syncProductStock(previousProductId);
    }
    await this.syncProductStock(newProductId);
    return savedVariant;
  }

  /** Xóa biến thể */
  async delete(id: number): Promise<void> {
    const usedInOrders = await this.orderItemRepo.count({
      where: { variant: { id } },
    });
    if (usedInOrders > 0) {
      throw new BadRequestException(
        'Biến thể đã có đơn hàng nên không thể xóa. Hãy ẩn biến thể hoặc ngừng bán.',
      );
    }
    const variant = await this.variantRepo.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!variant) throw new NotFoundException('Không tìm thấy biến thể');
    await this.variantRepo.remove(variant);
    await this.syncProductStock(variant.product.id);
  }
}
