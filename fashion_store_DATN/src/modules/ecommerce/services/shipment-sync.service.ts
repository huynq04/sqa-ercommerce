// shipping/services/shipment-sync.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentOrder } from '@modules/ecommerce/entities/shipmentOrder.entity';
import { ShipmentHistory } from '@modules/ecommerce/entities/shipmentHistory.entity';
import { GhnService } from '@providers/ghn/ghn.service';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '@modules/ecommerce/entities/order.entity';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';

@Injectable()
export class ShipmentSyncService {
  constructor(
    @InjectRepository(ShipmentOrder)
    private shipmentRepo: Repository<ShipmentOrder>,
    @InjectRepository(ShipmentHistory)
    private historyRepo: Repository<ShipmentHistory>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private ghnService: GhnService,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async syncShipment(shipment: ShipmentOrder) {
    if (shipment.ghnOrderCode == 'ABC' ) return;
    const data = await this.ghnService.getOrderInfo(shipment.ghnOrderCode);
    console.log(data.data.log);
    const logs = data?.data?.log;
    if (!Array.isArray(logs) || logs.length === 0) {
      return;
    }
    for (const log of logs) {
      const existed = await this.historyRepo.findOne({
        where: {
          shipmentOrderId: shipment.id,
          ghnStatus: log.status,
        },
      });

      if (existed) continue;

      await this.historyRepo.save({
        shipmentOrderId: shipment.id,
        ghnStatus: log.status,
        shipmentStatus: log.status as ShipmentStatus,
        occurredAt: new Date(log.updated_date),
      });
      shipment.shipmentStatus = log.status;
      await this.shipmentRepo.save(shipment);

      await this.applyOrderBusiness(shipment);
    }
  }

  async applyOrderBusiness(shipment: ShipmentOrder) {
    if (shipment.type !== 'order') return;

    const order = await this.orderRepo.findOne({
      where: { id: shipment.orderId },
    });

    if (!order) return;

    switch (shipment.shipmentStatus) {
      case ShipmentStatus.DELIVERED:
        order.orderStatus = OrderStatus.COMPLETED;
        order.paymentStatus = PaymentStatus.PAID;
        order.shipmentStatus = ShipmentStatus.DELIVERED;
        break;

      case ShipmentStatus.RETURNED:
        const orderItems = await this.orderItemRepo.find({
          where: { orderId: order.id },
          select: ['variantId', 'quantity'],
        });

        for (const item of orderItems) {
          await this.variantRepo.increment(
            { id: item.variantId },
            'stock',
            item.quantity,
          );
          const variant = await this.variantRepo.findOne({
            where: { id: item.variantId },
            select: ['productId'],
          });

          if (!variant) continue;

          await this.productRepo.increment(
            { id: variant.productId },
            'stock',
            item.quantity,
          );
        }
        order.orderStatus = OrderStatus.CANCELLED;
        order.paymentStatus = PaymentStatus.REFUNDED;
        order.shipmentStatus = shipment.shipmentStatus;
        break;
      case ShipmentStatus.CANCEL:
        const orderItem = await this.orderItemRepo.find({
          where: { orderId: order.id },
          select: ['variantId', 'quantity'],
        });

        for (const item of orderItem) {
          await this.variantRepo.increment(
            { id: item.variantId },
            'stock',
            item.quantity,
          );
          const variant = await this.variantRepo.findOne({
            where: { id: item.variantId },
            select: ['productId'],
          });

          if (!variant) continue;

          await this.productRepo.increment(
            { id: variant.productId },
            'stock',
            item.quantity,
          );
        }
        order.orderStatus = OrderStatus.CANCELLED;
        order.paymentStatus = PaymentStatus.REFUNDED;
        order.shipmentStatus = shipment.shipmentStatus;
        break;

      default:
        order.shipmentStatus = shipment.shipmentStatus;
        break;
    }

    await this.orderRepo.save(order);
  }
}
