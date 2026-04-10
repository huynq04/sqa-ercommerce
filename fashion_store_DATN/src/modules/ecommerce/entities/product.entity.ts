import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';
import { Category } from '@modules/ecommerce/entities/category.entity';
import { ProductImage } from '@modules/ecommerce/entities/productImage.entity';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { ProductReview } from './productReview.entity';

@Entity('products')
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ name: 'main_image_url', nullable: true })
  mainImageUrl: string;

  @OneToMany(() => ProductImage, (img) => img.product)
  images: ProductImage[];

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @OneToMany(() => ProductReview, (review) => review.product)
  reviews: ProductReview[];
}
