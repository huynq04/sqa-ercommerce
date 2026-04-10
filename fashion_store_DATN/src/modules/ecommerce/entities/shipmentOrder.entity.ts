import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';
import { Order } from '@modules/ecommerce/entities/order.entity';
import { ShipmentHistory } from '@modules/ecommerce/entities/shipmentHistory.entity';
import { ExchangeRequest } from '@modules/ecommerce/entities/exchangeRequest.entity';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';

@Entity('shipment_orders')
export class ShipmentOrder extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;
  @Column({ name: 'order_id' })
  orderId: number;

  @ManyToOne(() => ExchangeRequest, { nullable: true })
  @JoinColumn({ name: 'exchange_request_id' })
  exchangeRequest?: ExchangeRequest;

  @Column({ name: 'exchange_request_id', nullable: true })
  exchangeRequestId?: number;

  @Column({ name: 'ghn_order_code' })
  ghnOrderCode: string;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.READY_TO_PICK,
    name: 'shipment_status',
  })
  shipmentStatus: ShipmentStatus;

  @Column({
    type: 'enum',
    enum: ['order', 'exchange_pickup', 'exchange_delivery'],
  })
  type: 'order' | 'exchange_pickup' | 'exchange_delivery';

  @OneToMany(() => ShipmentHistory, (history) => history.shipmentOrder)
  histories: ShipmentHistory[];
}
