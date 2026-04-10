// exchange/entities/exchange-request.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';
import { ShipmentOrder } from '@modules/ecommerce/entities/shipmentOrder.entity';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { User } from '@modules/user/entities/user.entity';

@Entity('exchange_requests')
export class ExchangeRequest extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // @ManyToOne(() => OrderItem)
  // @JoinColumn({ name: 'order_item_id' })
  // orderItem: OrderItem;
  @OneToOne(() => OrderItem, (item) => item.exchange)
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @Column({ name: 'order_item_id' })
  orderItemId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason: string;

  // @Column({
  //   type: 'enum',
  //   enum: ['pending', 'approved', 'received', 'shipping_new', 'completed'],
  //   default: 'pending',
  // })
  // status: string;
  @Column({ default: 'pending' })
  status: string;

  @OneToMany(() => ShipmentOrder, (shipment) => shipment.exchangeRequest)
  shipments: ShipmentOrder[];
}
