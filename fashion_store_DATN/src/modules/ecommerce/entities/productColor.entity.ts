import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';

@Entity('product_colors')
export class ProductColor extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // @ManyToOne(() => Product, (p) => p.id)
  // product: Product;

  @Column({ length: 50 })
  color: string;
}
