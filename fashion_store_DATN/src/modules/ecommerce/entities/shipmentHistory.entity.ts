import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';
import { ShipmentOrder } from '@modules/ecommerce/entities/shipmentOrder.entity';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';

@Entity('shipment_histories')
export class ShipmentHistory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ShipmentOrder, (shipment) => shipment.histories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipment_order_id' })
  shipmentOrder: ShipmentOrder;

  @Column({ name: 'shipment_order_id' })
  shipmentOrderId: number;

  @Column({ name: 'ghn_status' })
  ghnStatus: string;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    name: 'shipment_status',
  })
  shipmentStatus: ShipmentStatus;

  @Column({ name: 'occurred_at' })
  occurredAt: Date;
}
