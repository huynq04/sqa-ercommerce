// // import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
// // import { BaseEntity } from '@base/model/base.entity';
// // import { Order } from '@modules/ecommerce/entities/order.entity';
// // import { User } from '@modules/user/entities/user.entity';
// // import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
// //
// // export enum ReturnStatus {
// //   PENDING = 'pending',
// //   APPROVED = 'approved',
// //   REJECTED = 'rejected',
// //   COMPLETED = 'completed',
// // }
// //
// // @Entity('return_requests')
// // export class ReturnRequest extends BaseEntity {
// //   @PrimaryGeneratedColumn()
// //   id: number;
// //
// //   @ManyToOne(() => Order)
// //   order: Order;
// //
// //   @ManyToOne(() => User)
// //   user: User;
// //
// //   @ManyToOne(() => ProductVariant)
// //   variant: ProductVariant;
// //
// //   @Column({ type: 'text' })
// //   reason: string;
// //
// //   @Column({ name: 'image_url', nullable: true })
// //   imageUrl: string;
// //
// //   @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.PENDING })
// //   status: ReturnStatus;
// // }
//
// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   JoinColumn,
// } from 'typeorm';
// import { BaseEntity } from '@base/model/base.entity';
// import { Order } from '@modules/ecommerce/entities/order.entity';
// import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
// import { User } from '@modules/user/entities/user.entity';
// import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
//
// export enum ReturnStatus {
//   PENDING = 'pending',
//   APPROVED = 'approved',
//   REJECTED = 'rejected',
//   WAITING_FOR_CUSTOMER = 'waiting_for_customer',
//   RECEIVED = 'received',
//   COMPLETED = 'completed',
// }
//
// export enum ReturnRequestType {
//   RETURN = 'return', // trả hàng
//   EXCHANGE = 'exchange', // đổi hàng
// }
//
// @Entity('return_requests')
// export class ReturnRequest extends BaseEntity {
//   @PrimaryGeneratedColumn()
//   id: number;
//
//   @ManyToOne(() => Order)
//   @JoinColumn({ name: 'order_id' })
//   order: Order;
//
//   @Column({ name: 'order_id' })
//   orderId: number;
//
//   @ManyToOne(() => OrderItem)
//   @JoinColumn({ name: 'order_item_id' })
//   orderItem: OrderItem;
//
//   @Column({ name: 'order_item_id' })
//   orderItemId: number;
//
//   @ManyToOne(() => User)
//   @JoinColumn({ name: 'user_id' })
//   user: User;
//
//   @Column({ name: 'user_id' })
//   userId: number;
//
//   @ManyToOne(() => ProductVariant)
//   @JoinColumn({ name: 'variant_id' })
//   variant: ProductVariant;
//
//   @Column({ name: 'variant_id' })
//   variantId: number;
//
//   @Column({ type: 'enum', enum: ReturnRequestType })
//   requestType: ReturnRequestType;
//
//   @Column({ type: 'text' })
//   reason: string;
//
//   @Column({ type: 'json', nullable: true })
//   images: string[];
//
//   @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.PENDING })
//   status: ReturnStatus;
//
//   @Column({ type: 'text', nullable: true })
//   rejectReason: string;
//
//   @Column({ nullable: true })
//   shippingCode: string; // mã vận đơn khi KH gửi hàng
// }
