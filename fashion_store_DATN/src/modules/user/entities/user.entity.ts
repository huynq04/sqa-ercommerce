// src/modules/users/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';
import { Cart } from '@modules/ecommerce/entities/cart.entity';
import { Order } from '@modules/ecommerce/entities/order.entity';
// import { ReturnRequest } from '@modules/ecommerce/entities/returnRequest.entity';
// import { WarrantyRequest } from '@modules/ecommerce/entities/warrantyRequest.entity';
import { Notification } from '@modules/ecommerce/entities/notification.entity';
import { ActivityLog } from '@modules/ecommerce/entities/activityLog.entity';
import { Role } from '@modules/auth/role.enum';
import { ProductReview } from '@modules/ecommerce/entities/productReview.entity';
import { ExchangeRequest } from '@modules/ecommerce/entities/exchangeRequest.entity';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ name: 'otp_code', nullable: true })
  otpCode: string;

  @Column({ name: 'otp_expires_at', nullable: true })
  otpExpiresAt: Date;

  @Column({ name: 'otp_attempts', default: 0 })
  otpAttempts: number;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'login_failed_count', default: 0 })
  loginFailedCount: number;

  @Column({ name: 'lock_until', nullable: true })
  lockUntil: Date;

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];

  @OneToMany(() => ActivityLog, (log) => log.user)
  activityLogs: ActivityLog[];

  @OneToMany(() => ProductReview, (review) => review.user)
  reviews: ProductReview[];

  @OneToMany(() => ExchangeRequest, (r) => r.user)
  exchangeRequests: ExchangeRequest[];
}
