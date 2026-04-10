import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@modules/ecommerce/entities/order.entity';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { Cart } from '@modules/ecommerce/entities/cart.entity';
import { BuyNowDto, CreateOrderDto } from '../dtos/order.dto';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';
import { BaseService } from '@base/services/base.service';
import { RedisService } from '@base/db/redis/redis.service';
import { PaginatedResult } from '@base/dtos/paginated-result.dto';
import { DiscountCode } from '@modules/ecommerce/entities/discountCode.entity';
import { VnpayService } from '@providers/vnpay/vnpay.service';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';
import { ShipmentOrder } from '@modules/ecommerce/entities/shipmentOrder.entity';

@Injectable()
export class UserOrderService extends BaseService<Order> {
  private readonly stockLockTtlMs = 5 * 60 * 1000;
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(DiscountCode)
    private readonly discountRepo: Repository<DiscountCode>,
    private readonly vnpayService: VnpayService,
    private readonly redisService: RedisService,
    @InjectRepository(ShipmentOrder)
    private readonly shipmentRepo: Repository<ShipmentOrder>,
  ) {
    super(orderRepo, 'order');
  }

  /** Mua ngay */
  async buyNow(userId: number, dto: BuyNowDto) {
    const variant = await this.variantRepo.findOne({
      where: { id: dto.variantId },
      relations: ['product'],
    });
    const product = await this.productRepo.findOne({
      where: { id: variant.product.id },
    });
    console.log(product);
    if (!variant) throw new NotFoundException('Không tìm thấy biến thể');
    await this.lockProduct({ cart: { quantity: dto.quantity } }, variant);

    let total = variant.price * dto.quantity;
    let appliedDiscount: DiscountCode | null = null;

    //  Nếu có discountCode
    if (dto.discountCode) {
      appliedDiscount = await this.validateDiscount(dto.discountCode);
      const discountAmount = (total * appliedDiscount.discountPercent) / 100;
      total -= discountAmount;
      await this.applyDiscountUsage(appliedDiscount);
    }

    const parsedShippingFee = Number(dto.shippingFee ?? 0);
    const shippingFee = Number.isFinite(parsedShippingFee)
      ? Math.max(0, parsedShippingFee)
      : 0;
    total += shippingFee;

    const order = this.orderRepo.create({
      user: { id: userId },
      paymentMethod: dto.paymentMethod,
      shippingAddress: dto.shippingAddress,
      totalAmount: total,
      paymentStatus:
        dto.paymentMethod === PaymentMethod.COD
          ? PaymentStatus.UNPAID
          : PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
      shipmentStatus: ShipmentStatus.READY_TO_PICK,
      vnpTransDate: '20250112121212',
      vnpTxnRef: '20250112121212',
    });

    const savedOrder = await this.orderRepo.save(order);
    await this.createShipmentForOrder(savedOrder);
    const item = this.orderItemRepo.create({
      order: savedOrder,
      variant,
      quantity: dto.quantity,
      price: variant.price,
    });
    await this.orderItemRepo.save(item);

    // Trừ tồn neeus COD
    if (dto.paymentMethod == PaymentMethod.COD) {
      variant.stock -= dto.quantity;
      await this.variantRepo.save(variant);
      product.stock -= dto.quantity;
      await this.productRepo.save(product);
    }

    if (dto.paymentMethod === PaymentMethod.VNPAY) {
      const logger = new Logger('OrderService');

      try {
        const paymentUrl = await this.vnpayService.createPaymentUrl({
          orderId: savedOrder.id,
          amount: total,
          orderInfo: `Thanh toán đơn hàng #${savedOrder.id}`,
          orderType: 'other',
          locale: 'vn',
          clientIp: '127.0.0.1',
        });
        const verify = await this.orderRepo.findOne({
          where: { id: savedOrder.id },
        });
        savedOrder.paymentStatus = PaymentStatus.PENDING;
        savedOrder.orderStatus = OrderStatus.PENDING;
        savedOrder.paymentMethod = PaymentMethod.VNPAY;
        savedOrder.vnpTransDate = verify.vnpTransDate;
        savedOrder.vnpTxnRef = verify.vnpTxnRef;
        await this.orderRepo.save(savedOrder);

        return {
          order: savedOrder,
          payUrl: paymentUrl,
        };
      } catch (err) {
        logger.error(
          `Lỗi tạo link VNPay cho order #${savedOrder.id}: ${err.message}`,
        );

        savedOrder.paymentStatus = PaymentStatus.PENDING;
        savedOrder.orderStatus = OrderStatus.PENDING;
        savedOrder.paymentMethod = PaymentMethod.VNPAY;
        await this.orderRepo.save(savedOrder);

        return {
          order: savedOrder,
          payUrl: null,
          message:
            'Không thể tạo link thanh toán VNPay. Hệ thống sẽ kiểm tra lại sau.',
        };
      }
    }

    return savedOrder;
  }

  /** Mua từ giỏ hàng */
  async fromCart(userId: number, dto: CreateOrderDto) {
    const cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.variant', 'items.variant.product'],
    });
    if (!cart || !cart.items.length)
      throw new NotFoundException('Giỏ hàng trống');
    for (const item of cart.items) {
      await this.lockProduct(
        { cart: { quantity: item.quantity } },
        item.variant,
      );
    }

    let total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    let appliedDiscount: DiscountCode | null = null;

    if (dto.discountCode) {
      appliedDiscount = await this.validateDiscount(dto.discountCode);
      const discountAmount = (total * appliedDiscount.discountPercent) / 100;
      total -= discountAmount;
      await this.applyDiscountUsage(appliedDiscount);
    }

    const parsedShippingFee = Number(dto.shippingFee ?? 0);
    const shippingFee = Number.isFinite(parsedShippingFee)
      ? Math.max(0, parsedShippingFee)
      : 0;
    total += shippingFee;

    const order = this.orderRepo.create({
      user: { id: userId },
      paymentMethod: dto.paymentMethod,
      shippingAddress: dto.shippingAddress,
      totalAmount: total,
      paymentStatus:
        dto.paymentMethod === PaymentMethod.COD
          ? PaymentStatus.UNPAID
          : PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
      shipmentStatus: ShipmentStatus.READY_TO_PICK,
      vnpTransDate: '20250112121212',
      vnpTxnRef: '20250112121212',
    });

    const savedOrder = await this.orderRepo.save(order);
    await this.createShipmentForOrder(savedOrder);
    for (const item of cart.items) {
      const orderItem = this.orderItemRepo.create({
        order: savedOrder,
        variant: item.variant,
        quantity: item.quantity,
        price: item.price,
      });
      await this.orderItemRepo.save(orderItem);

      if (dto.paymentMethod == PaymentMethod.COD) {
        item.variant.stock -= item.quantity;
        await this.variantRepo.save(item.variant);
        const product = item.variant.product;
        product.stock -= item.quantity;
        await this.productRepo.save(product);
      }
    }

    await this.cartRepo.manager.remove(cart.items);
    await this.cartRepo.remove(cart);

    if (dto.paymentMethod === PaymentMethod.VNPAY) {
      const logger = new Logger('OrderService');

      try {
        const paymentUrl = await this.vnpayService.createPaymentUrl({
          orderId: savedOrder.id,
          amount: total,
          orderInfo: `Thanh toán đơn hàng #${savedOrder.id}`,
          orderType: 'other',
          locale: 'vn',
          clientIp: '127.0.0.1',
        });
        const verify = await this.orderRepo.findOne({
          where: { id: savedOrder.id },
        });
        savedOrder.paymentStatus = PaymentStatus.PENDING;
        savedOrder.orderStatus = OrderStatus.PENDING;
        savedOrder.paymentMethod = PaymentMethod.VNPAY;
        savedOrder.vnpTransDate = verify.vnpTransDate;
        savedOrder.vnpTxnRef = verify.vnpTxnRef;
        await this.orderRepo.save(savedOrder);

        return {
          order: savedOrder,
          payUrl: paymentUrl,
        };
      } catch (err) {
        logger.error(
          `Lỗi tạo link VNPay cho order #${savedOrder.id}: ${err.message}`,
        );

        savedOrder.paymentStatus = PaymentStatus.PENDING;
        savedOrder.orderStatus = OrderStatus.PENDING;
        savedOrder.paymentMethod = PaymentMethod.VNPAY;
        await this.orderRepo.save(savedOrder);

        return {
          order: savedOrder,
          payUrl: null,
          message:
            'Không thể tạo link thanh toán VNPay. Hệ thống sẽ kiểm tra lại sau.',
        };
      }
    }
    return savedOrder;
  }

  /** Danh sách đơn hàng của user */
  async listUserOrders(
    userId: number,
    query: QuerySpecificationDto,
  ): Promise<PaginatedResult<Order>> {
    query.searchFields = ['shippingAddress', 'status'];
    query.sort = query.sort ?? { createdAt: -1 };

    return this.listPaginate(query, {
      where: { user_id: userId },
      relations: ['items', 'items.variant', 'items.variant.product'],
    });
  }

  private async applyDiscountUsage(discount: DiscountCode) {
    const result = await this.discountRepo
      .createQueryBuilder()
      .update(DiscountCode)
      .set({ usedCount: () => 'used_count + 1' })
      .where('id = :id AND (usage_limit = 0 OR used_count < usage_limit)', {
        id: discount.id,
      })
      .execute();

    if (!result.affected) {
      throw new BadRequestException('Ma giam gia da duoc su dung toi da');
    }
  }

  private async validateDiscount(code: string): Promise<DiscountCode> {
    const discount = await this.discountRepo.findOne({ where: { code } });
    if (!discount) throw new NotFoundException('Mã giảm giá không hợp lệ');

    const now = new Date();
    const start = new Date(discount.startDate as unknown as string);
    const end = new Date(discount.endDate as unknown as string);
    end.setHours(23, 59, 59, 999);
    if (start > now || end < now) {
      throw new NotFoundException('Mã giảm giá đã hết hạn');
    }

    if (discount.usageLimit > 0 && discount.usedCount >= discount.usageLimit) {
      throw new NotFoundException('Mã giảm giá đã được sử dụng tối đa');
    }

    return discount;
  }

  async handlePaymentCallback(
    orderId: number,
    responseCode: string,
    amount: number,
  ) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return { RspCode: '01', Message: 'Order not found' };

    // tránh xử lý lại
    if (order.paymentStatus === PaymentStatus.PAID)
      return { RspCode: '02', Message: 'Order already paid' };

    if (responseCode === '00') {
      order.paymentStatus = PaymentStatus.PAID;
      order.orderStatus = OrderStatus.CONFIRMED;
    } else {
      order.paymentStatus = PaymentStatus.FAILED;
      order.orderStatus = OrderStatus.CANCELLED;
    }

    await this.orderRepo.save(order);
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  async getOrderDetail(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.color',
        'items.variant.size',
        'items.review',
        'items.exchange',
      ],
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    return order;
  }

  async getOrderCommentStatus(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.review',
      ],
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const delivered =
      order.orderStatus === OrderStatus.COMPLETED ||
      order.shipmentStatus === ShipmentStatus.DELIVERED;

    return {
      orderId: order.id,
      orderStatus: order.orderStatus,
      shipmentStatus: order.shipmentStatus,
      items: order.items.map((item) => ({
        orderItemId: item.id,
        productId: item.variant.product.id,
        productName: item.variant.product.name,
        variantId: item.variant.id,
        canComment: delivered && !item.review,
        reviewed: Boolean(item.review),
        review: item.review ?? null,
      })),
    };
  }

  private getStockKey(variantId: number): string {
    return `stock:variant:${variantId}`;
  }

  async lockProduct(
    order: { cart: { quantity: number } },
    variant: ProductVariant,
    timeMs?: number,
  ) {
    const stockKey = this.getStockKey(variant.id);
    const cacheQty = await this.redisService.get<number | string>(stockKey);
    let stockQty: number;
    const ttlSeconds = Math.ceil((timeMs ?? this.stockLockTtlMs) / 1000);

    if (cacheQty === null || cacheQty === undefined) {
      stockQty = variant.stock;
      await this.redisService.setNx(stockKey, variant.stock, ttlSeconds);
    } else {
      stockQty = parseInt(String(cacheQty), 10);
    }

    if (stockQty < order.cart.quantity) {
      throw new BadRequestException('Sản phẩm đã hết hàng hoặc không đủ qty');
    }

    const lockedCount = await this.redisService.incrBy(
      stockKey,
      -1 * order.cart.quantity,
    );
    if (lockedCount < 0) {
      throw new BadRequestException('Sản phẩm đang trong giao dịch');
    }

    await this.redisService.expire(stockKey, ttlSeconds);
  }

  private async createShipmentForOrder(order: Order) {
    await this.shipmentRepo.save({
      orderId: order.id,
      shipmentStatus: ShipmentStatus.READY_TO_PICK,
      ghnOrderCode: 'ABC',
      type: 'order',
    });
  }

  async getOrderTracking(userId: number, orderId: number) {
    // Kiểm tra order có thuộc user không
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['shipments', 'shipments.histories'],
    });

    console.log(order);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // Trả về thông tin tracking
    return {
      orderId: order.id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      shipmentStatus: order.shipmentStatus,
      shipments: order.shipments.map((shipment) => ({
        shipmentOrderId: shipment.id,
        type: shipment.type,
        ghnOrderCode: shipment.ghnOrderCode,
        currentStatus: shipment.shipmentStatus,
        histories: shipment.histories
          .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
          .map((h) => ({
            status: h.shipmentStatus,
            ghnStatus: h.ghnStatus,
            occurredAt: h.occurredAt,
          })),
      })),
    };
  }
}
