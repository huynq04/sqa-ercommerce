import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';
import { User } from '@modules/user/entities/user.entity';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { ProductReview } from './productReview.entity';
import { ShipmentOrder } from '@modules/ecommerce/entities/shipmentOrder.entity';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  // SHIPPING = 'shipping',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PROCESSING = 'processing',
}

export enum PaymentMethod {
  COD = 'cod',
  VNPAY = 'vnpay',
}

export enum PaymentStatus {
  UNPAID = 'unpaid', // Chưa thanh toán
  PENDING = 'pending', // Đang chờ xác nhận (VD: VNPay timeout)
  PAID = 'paid', // Đã thanh toán
  FAILED = 'failed', // Thanh toán thất bại
  REFUNDED = 'refunded', // Đã hoàn tiền
}

// export enum ShipmentStatus {
//   READY_TO_PICK = 'ready_to_pick',
//   PICKING = 'picking',
//   CANCEL = 'cancel',
//   MONEY_COLLECT_PICKING = 'money_collect_picking',
//   PICKED = 'picked',
//   STORING = 'storing',
//   TRANSPORTING = 'transporting',
//   SORTING = 'sorting',
//   DELIVERING = 'delivering',
//   MONEY_COLLECT_DELIVERING = 'money_collect_delivering',
//   DELIVERED = 'delivered',
//   DELIVERY_FAIL = 'delivery_fail',
//   WAITING_TO_RETURN = 'waiting_to_return',
//   RETURN = 'return',
//   RETURN_TRANSPORTING = 'return_transporting',
//   RETURN_SORTING = 'return_sorting',
//   RETURNING = 'returning',
//   RETURN_FAIL = 'return_fail',
//   RETURNED = 'returned',
// }

@Entity('orders')
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  orderStatus: OrderStatus;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.COD,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.READY_TO_PICK,
  })
  shipmentStatus: ShipmentStatus;

  @Column({ name: 'shipping_address' })
  shippingAddress: string;

  @Column({ name: 'vnp_trans_date' })
  vnpTransDate: string;

  @Column({ name: 'vnp_txn_ref' })
  vnpTxnRef: string;

  @Column({ name: 'ghn_order_code', nullable: true })
  ghnOrderCode: string;

  @Column({ name: 'vnpay_check_count', default: 0 })
  vnpayCheckCount: number;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @OneToMany(() => ProductReview, (review) => review.order)
  reviews: ProductReview[];

  @OneToMany(() => ShipmentOrder, (shipment) => shipment.order)
  shipments: ShipmentOrder[];
}
