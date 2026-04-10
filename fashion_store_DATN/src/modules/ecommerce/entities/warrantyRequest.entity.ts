// // import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
// // import { BaseEntity } from '@base/model/base.entity';
// // import { ProductVariant } from './productVariant.entity';
// // import { User } from '@modules/user/entities/user.entity';
// // import { Order } from '@modules/ecommerce/entities/order.entity';
// //
// // export enum WarrantyStatus {
// //   PENDING = 'pending',
// //   APPROVED = 'approved',
// //   COMPLETED = 'completed',
// //   REJECTED = 'rejected',
// // }
// //
// // @Entity('warranty_requests')
// // export class WarrantyRequest extends BaseEntity {
// //   @PrimaryGeneratedColumn()
// //   id: number;
// //
// //   @ManyToOne(() => ProductVariant)
// //   variant: ProductVariant;
// //
// //   @ManyToOne(() => User)
// //   user: User;
// //
// //   @ManyToOne(() => Order)
// //   order: Order;
// //
// //   @Column({ type: 'text' })
// //   issueDescription: string;
// //
// //   @Column({
// //     type: 'enum',
// //     enum: WarrantyStatus,
// //     default: WarrantyStatus.PENDING,
// //   })
// //   status: WarrantyStatus;
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
// export enum WarrantyStatus {
//   PENDING = 'pending',
//   APPROVED = 'approved',
//   REJECTED = 'rejected',
//   RECEIVED = 'received',
//   PROCESSING = 'processing',
//   COMPLETED = 'completed',
// }
//
// @Entity('warranty_requests')
// export class WarrantyRequest extends BaseEntity {
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
//   @Column({ type: 'text' })
//   reason: string;
//
//   @Column({ type: 'json', nullable: true })
//   images: string[];
//
//   @Column({
//     type: 'enum',
//     enum: WarrantyStatus,
//     default: WarrantyStatus.PENDING,
//   })
//   status: WarrantyStatus;
//
//   @Column({ type: 'text', nullable: true })
//   rejectReason: string;
//
//   @Column({ nullable: true })
//   shippingCode: string;
//
//   @Column({ type: 'text', nullable: true })
//   warrantyResult: string;
// }
