import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';

@Entity('product_sizes')
export class ProductSize extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // @ManyToOne(() => Product, (p) => p.id)
  // product: Product;

  @Column({ length: 20 })
  size: string;
}
