import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  Order,
} from '@modules/ecommerce/entities/order.entity';
import { VnpayService } from '@providers/vnpay/vnpay.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';

@Injectable()
export class OrderScheduler {
  private readonly logger = new Logger('OrderScheduler');

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly vnpayService: VnpayService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkPendingVnPayOrders() {
    const orders = await this.orderRepo.find({
      where: {
        paymentMethod: PaymentMethod.VNPAY,
        paymentStatus: PaymentStatus.PENDING,
      },
    });
    for (const order of orders) {
      try {
        const result = await this.vnpayService.checkTransaction(order.id);

        const resCode = result?.vnp_ResponseCode;
        const transStatus = result?.vnp_TransactionStatus;

        if (resCode === '00' && transStatus === '00') {
          const orderItems = await this.orderItemRepo.find({
            where: { orderId: order.id },
            select: ['variantId', 'quantity'],
          });

          for (const item of orderItems) {
            await this.variantRepo.decrement(
              { id: item.variantId },
              'stock',
              item.quantity,
            );
            const variant = await this.variantRepo.findOne({
              where: { id: item.variantId },
              select: ['productId'],
            });

            if (!variant) continue;

            await this.productRepo.decrement(
              { id: variant.productId },
              'stock',
              item.quantity,
            );
          }
          order.paymentStatus = PaymentStatus.PAID;
          order.orderStatus = OrderStatus.CONFIRMED;
          this.logger.log(`Order #${order.id} => PAID`);
        } else if (
          (resCode === '00' && transStatus === '01') ||
          ['09', '75', '91', '94'].includes(resCode)
        ) {
          // this.logger.warn(
          //   `Order #${order.id} vẫn đang chờ xử lý (${resCode})`,
          // );
          // continue; // vẫn pending, check sau
          order.vnpayCheckCount = (order.vnpayCheckCount || 0) + 1;

          if (order.vnpayCheckCount < 3) {
            this.logger.warn(
              `Order #${order.id} pending (${resCode}) - lần ${order.vnpayCheckCount}/3`,
            );
            await this.orderRepo.save(order);
            continue;
          }

          //QUÁ 3 LẦN → CANCEL + ROLLBACK
          this.logger.warn(`Order #${order.id} quá 3 lần pending → CANCEL`);
          order.paymentStatus = PaymentStatus.FAILED;
          order.orderStatus = OrderStatus.CANCELLED;
        } else {
          order.paymentStatus = PaymentStatus.FAILED;
          order.orderStatus = OrderStatus.CANCELLED;
          this.logger.warn(`Order #${order.id} => FAILED (${resCode})`);
        }

        await this.orderRepo.save(order);
      } catch (err) {
        this.logger.error(`Lỗi khi check order #${order.id}: ${err.message}`);
      }
    }
  }
}
