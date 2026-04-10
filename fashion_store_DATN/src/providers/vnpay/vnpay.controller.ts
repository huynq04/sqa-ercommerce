import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { Request, Response } from 'express';
import { CreatePaymentDto } from '@providers/vnpay/dto/vnpay.dto';
import { getClientIPv4 } from '@providers/vnpay/utils/ip.util';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '@modules/ecommerce/entities/order.entity';
import { Repository } from 'typeorm';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';

@ApiTags('VNPAY')
@Controller('payments/vnpay')
export class VnpayController {
  constructor(
    private readonly vnpay: VnpayService,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  @Post('create')
  createPayment(@Body() dto: CreatePaymentDto, @Req() req: Request) {
    const clientIp = getClientIPv4(req);
    const url = this.vnpay.createPaymentUrl({
      orderId: dto.orderId,
      amount: Math.round(Number(dto.amount) || 0),
      orderInfo: (dto.orderInfo || '').slice(0, 255),
      orderType: dto.orderType,
      locale: dto.locale,
      bankCode: dto.bankCode,
      clientIp,
    });

    return { payUrl: url };
  }

  @Get('return')
  handleReturn(@Query() query: Record<string, string>, @Res() res: Response) {
    const result = this.vnpay.verifyReturnOrIpn(query);
    const txnRef = query['vnp_TxnRef'];
    const orderId = txnRef.split('_')[0];
    if (!result.isValid) {
      return res.redirect(
        `http://localhost:5173/order-success?orderId=${orderId}&status=failed`,
      );
    }

    const code = query['vnp_ResponseCode'];
    if (code === '00') {
      return res.redirect(
        `http://localhost:5173/order-success?orderId=${orderId}&status=success`,
      );
    }

    return res.redirect(
      `http://localhost:5173/order-success?orderId=${orderId}&status=failed`,
    );
  }

  @Get('ipn')
  async handleIpn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    const { isValid, data } = this.vnpay.verifyReturnOrIpn(query);
    if (!isValid)
      return res.json({ RspCode: '97', Message: 'Invalid signature' });
    // TODO: tra cứu order (vnp_TxnRef), so khớp amount (== amount*100), idempotent ...
    const orderId = Number(data['vnp_TxnRef'].split('_')[0]); // VD: "8_1761794437743" → "8"
    const responseCode = data['vnp_ResponseCode'];
    const amount = Number(data['vnp_Amount']) / 100;
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return res.json({ RspCode: '01', Message: 'Order not found' });

    // Kiểm tra idempotent — tránh xử lý 2 lần
    if (order.paymentStatus === PaymentStatus.PAID)
      return res.json({ RspCode: '02', Message: 'Order already paid' });

    if (responseCode === '00') {
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
      // Thanh toán thành công
      order.paymentStatus = PaymentStatus.PAID;
      order.orderStatus = OrderStatus.CONFIRMED;
    } else {
      // Thanh toán thất bại
      order.paymentStatus = PaymentStatus.FAILED;
      order.orderStatus = OrderStatus.CANCELLED;
    }

    await this.orderRepo.save(order);
    return res.json({ RspCode: '00', Message: 'Confirm Success' });
  }
}
