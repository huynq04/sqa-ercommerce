import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';

@Entity('product_images')
export class ProductImage extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (p) => p.images)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @Column({ name: 'is_main', default: false })
  isMain: boolean;

  // @Column({ name: 'sort_order', default: 0 })
  // sortOrder: number;
}
