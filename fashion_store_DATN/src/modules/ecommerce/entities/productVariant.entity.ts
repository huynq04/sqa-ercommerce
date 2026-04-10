// src/modules/products/productVariant.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { ProductSize } from '@modules/ecommerce/entities/productSize.entity';
import { ProductColor } from '@modules/ecommerce/entities/productColor.entity';

@Entity('product_variants')
export class ProductVariant extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (p) => p.variants)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => ProductSize, { nullable: true })
  @JoinColumn({ name: 'size_id' })
  size: ProductSize;

  @ManyToOne(() => ProductColor, { nullable: true })
  @JoinColumn({ name: 'color_id' })
  color: ProductColor;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;
}
