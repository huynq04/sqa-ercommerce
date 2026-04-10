import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';
import { Order } from '@modules/ecommerce/entities/order.entity';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { ProductReview } from './productReview.entity';
import { ExchangeRequest } from '@modules/ecommerce/entities/exchangeRequest.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: number;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ name: 'variant_id' })
  variantId: number;
  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @OneToOne(() => ProductReview, (review) => review.orderItem)
  review: ProductReview;

  @OneToOne(() => ExchangeRequest, (er) => er.orderItem)
  exchange?: ExchangeRequest;
}
