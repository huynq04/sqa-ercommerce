import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReasonDto } from '@modules/ecommerce/dtos/return-exchange.dto';
import { ExchangeRequest } from '@modules/ecommerce/entities/exchangeRequest.entity';
import { ExchangeStatus } from '@modules/ecommerce/enums/exchangeStatus.enum';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';
import { GhnService } from '@providers/ghn/ghn.service';
import { ShipmentOrder } from '@modules/ecommerce/entities/shipmentOrder.entity';
import { CreateShippingOrderDto } from '@providers/ghn/dto/ghn.dto';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { UserOrderService } from '@modules/ecommerce/services/user-order.service';

@Injectable()
export class AdminExchangeRequestService {
  constructor(
    @InjectRepository(ExchangeRequest)
    private readonly exchangeRepo: Repository<ExchangeRequest>,
    private ghnService: GhnService,
    @InjectRepository(ShipmentOrder)
    private shipmentRepo: Repository<ShipmentOrder>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly mailerService: MailerService,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly orderService: UserOrderService,
  ) {}

  // async approveReturn(id: number) {
  //   const rr = await this.exchangeRepo.findOne({ where: { id } });
  //   if (!rr) throw new NotFoundException('Return request không tồn tại');
  //   rr.status = ExchangeStatus.APPROVED;
  //   return this.exchangeRepo.save(rr);
  // }
  async approveReturn(id: number) {
    const rr = await this.exchangeRepo.findOne({
      where: { id },
      relations: ['orderItem', 'orderItem.order'],
    });

    if (!rr) throw new NotFoundException('Return request không tồn tại');

    if (rr.status === ExchangeStatus.REJECTED) {
      throw new BadRequestException('Yêu cầu đã bị từ chối');
    }

    if (rr.status !== ExchangeStatus.PENDING) {
      throw new BadRequestException('Yêu cầu không hợp lệ');
    }

    const order = rr.orderItem.order;

    /** 1️⃣ Lấy shipment GHN cũ của order */
    // const oldShipment = order.shipments.find(
    //   (s) => s.type === 'order' && s.ghnOrderCode,
    // );
    const oldShipment = await this.shipmentRepo.findOne({
      where: {
        orderId: order.id,
        type: 'order',
      },
    });
    console.log(oldShipment);

    if (!oldShipment) {
      throw new BadRequestException('Không tìm thấy đơn GHN gốc');
    }

    /** 2️⃣ Lấy chi tiết GHN order cũ */
    const oldGhnDetail = await this.ghnService.getOrderInfo(
      oldShipment.ghnOrderCode,
    );

    /**
     * oldGhnDetail.data = {
     *   from_name, from_phone, from_address
     *   to_name, to_phone, to_address
     * }
     */

    const data = oldGhnDetail.data;

    /** 3️⃣ Map sang CreateShippingOrderDto */
    const dto: CreateShippingOrderDto = {
      orderId: rr.orderItem.order.id,

      /** ĐỊA CHỈ SHOP (nhận hàng về) */
      toName: data.return_name ?? 'SHOP',
      toPhone: data.return_phone,
      toAddress: data.return_address,
      toWardCode: data.return_ward_code,
      toDistrictId: data.return_district_id,

      /** ĐỊA CHỈ KHÁCH (trả về nếu fail) */
      returnPhone: data.to_phone,
      returnAddress: data.to_address,
      returnWardCode: data.to_ward_code,
      returnDistrictId: data.to_district_id,

      /** HÀNG HÓA */
      items: data.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        weight: i.weight,
        length: i.length,
        width: i.width,
        height: i.height,
      })),

      weight: data.weight,
      length: data.length,
      width: data.width,
      height: data.height,

      codAmount: 0, // đổi hàng → không thu COD
      note: 'Lấy hàng đổi trả về shop',
      content: 'Exchange pickup',
    };
    /** 4️⃣ Tạo GHN order lấy hàng về shop */
    const ghnPickup = await this.ghnService.createShippingOrderExchange(dto);
    /** 5️⃣ Lưu ShipmentOrder */
    const shipment = this.shipmentRepo.create({
      orderId: order.id,
      exchangeRequestId: rr.id,
      ghnOrderCode: ghnPickup.data.order_code,
      type: 'exchange_pickup',
      shipmentStatus: ShipmentStatus.READY_TO_PICK,
    });
    await this.shipmentRepo.save(shipment);
    /** 6️⃣ Update exchange status */
    rr.status = ExchangeStatus.APPROVED;
    return this.exchangeRepo.save(rr);
  }

  async rejectReturn(id: number, dto: ReasonDto) {
    const rr = await this.exchangeRepo.findOne({ where: { id } });
    if (!rr) throw new NotFoundException('Return request không tồn tại');
    rr.status = ExchangeStatus.REJECTED;
    rr.rejectReason = dto.reason;
    return this.exchangeRepo.save(rr);
  }

  // async receiveReturn(id: number) {
  //   const rr = await this.exchangeRepo.findOne({ where: { id } });
  //   rr.status = ExchangeStatus.RECEIVED;
  //   return this.exchangeRepo.save(rr);
  // }
  async receiveReturn(id: number) {
    const rr = await this.exchangeRepo.findOne({
      where: { id },
      relations: [
        'orderItem',
        'orderItem.order',
        'orderItem.variant',
        'orderItem.variant.product',
        'orderItem.order.shipments',
        'user',
      ],
    });

    if (!rr) throw new NotFoundException('Exchange request không tồn tại');

    // if (rr.status !== ExchangeStatus.APPROVED) {
    //   throw new BadRequestException('Yêu cầu chưa ở trạng thái approved');
    // }
    if (rr.status == ExchangeStatus.SHIPPING_NEW) {
      return {
        message: 'Đã gửi hàng cho khách',
      };
    }
    /** 1️⃣ Đánh dấu đã nhận hàng */
    rr.status = ExchangeStatus.RECEIVED;
    await this.exchangeRepo.save(rr);

    const variant = rr.orderItem.variant;

    //   /** Check tồn kho */
    //   if (variant.stock <= 0) {
    //     /**  Hết hàng → gửi mail */
    //     // await this.mailerService.sendMail({
    //     //   to: rr.user.email,
    //     //   subject: 'Sản phẩm đổi tạm thời hết hàng',
    //     //   template: 'exchange-out-of-stock',
    //     //   context: {
    //     //     productName: variant.product.name,
    //     //     exchangeId: rr.id,
    //     //     waitDays: '1–2',
    //     //   },
    //     // });
    //     await this.mailerService.sendMail({
    //       to: rr.user.email,
    //       subject: 'Sản phẩm đổi tạm thời hết hàng',
    //       html: `
    //   <p>Sản phẩm <b>${variant.product.name}</b> hiện đang hết hàng.</p>
    //   <p>Mã đổi hàng: <b>#${rr.id}</b></p>
    //   <p>Dự kiến có lại sau 1–2 ngày.</p>
    // `,
    //     });
    //
    //     return {
    //       message:
    //         'Đã nhận hàng đổi. Sản phẩm tạm hết hàng, đã gửi mail thông báo cho khách.',
    //     };
    //   }
    /** Tạm khóa stock bằng Redis */
    try {
      await this.orderService.lockProduct(
        { cart: { quantity: rr.orderItem.quantity } },
        variant,
      );
    } catch (err) {
      /** Hết hàng → gửi mail khách */
      await this.mailerService.sendMail({
        to: rr.user.email,
        subject: 'Sản phẩm đổi tạm thời hết hàng',
        html: `
        <p>Sản phẩm <b>${variant.product.name}</b> hiện đang hết hàng.</p>
        <p>Mã đổi hàng: <b>#${rr.id}</b></p>
        <p>Dự kiến có lại sau 1–2 ngày.</p>
      `,
      });

      return {
        message:
          'Đã nhận hàng đổi. Sản phẩm tạm hết hàng, đã gửi mail thông báo cho khách.',
      };
    }

    /** 3️⃣ Lấy shipment GHN gốc */
    const oldShipment = rr.orderItem.order.shipments.find(
      (s) => s.type === 'order',
    );

    if (!oldShipment) {
      throw new BadRequestException('Không tìm thấy shipment gốc');
    }

    const ghnDetail = await this.ghnService.getOrderInfo(
      oldShipment.ghnOrderCode,
    );

    const data = ghnDetail.data;

    /** 4️⃣ Map DTO gửi hàng mới cho khách */
    const dto: CreateShippingOrderDto = {
      orderId: rr.orderItem.order.id,

      /** ĐỊA CHỈ KHÁCH */
      toName: data.to_name,
      toPhone: data.to_phone,
      toAddress: data.to_address,
      toWardCode: data.to_ward_code,
      toDistrictId: data.to_district_id,

      /** ĐỊA CHỈ SHOP (hoàn hàng nếu fail) */
      returnPhone: data.return_phone,
      returnAddress: data.return_address,
      returnWardCode: data.return_ward_code,
      returnDistrictId: data.return_district_id,

      items: data.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        weight: i.weight,
        length: i.length,
        width: i.width,
        height: i.height,
      })),

      weight: data.weight,
      length: data.length,
      width: data.width,
      height: data.height,

      codAmount: 0,
      note: 'Gửi hàng đổi cho khách',
      content: 'Exchange delivery',
    };

    /** 5️⃣ Tạo GHN gửi hàng mới */
    const ghnDelivery = await this.ghnService.createShippingOrderExchange(dto);
    /** 6️⃣ Lưu shipment mới */
    const shipment = this.shipmentRepo.create({
      orderId: rr.orderItem.order.id,
      exchangeRequestId: rr.id,
      type: 'exchange_delivery',
      ghnOrderCode: ghnDelivery.orderCode,
      shipmentStatus: ShipmentStatus.READY_TO_PICK,
    });
    await this.shipmentRepo.save(shipment);

    /** 7️⃣ Trừ tồn kho */
    variant.stock -= rr.orderItem.quantity;
    await this.variantRepo.save(variant);
    const product = rr.orderItem.variant.product;
    product.stock -= rr.orderItem.quantity;
    await this.productRepo.save(product);
    /** 8️⃣ Update exchange status */
    rr.status = ExchangeStatus.SHIPPING_NEW;
    await this.exchangeRepo.save(rr);

    return {
      message: 'Đã tạo đơn giao hàng đổi cho khách',
      ghnOrderCode: ghnDelivery.orderCode,
    };
  }

  async completeReturn(id: number) {
    const rr = await this.exchangeRepo.findOne({ where: { id } });
    rr.status = ExchangeStatus.COMPLETED;
    return this.exchangeRepo.save(rr);
  }

  async listAllReturns() {
    return this.exchangeRepo.find({
      relations: [
        'orderItem',
        'orderItem.variant',
        'orderItem.variant.product',
        'orderItem.order',
        'user',
      ],
    });
  }

  async getReturnById(id: number) {
    const request = await this.exchangeRepo.findOne({
      where: { id },
      relations: [
        'orderItem',
        'orderItem.variant',
        'orderItem.variant.product',
        'user',
      ],
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu hoàn trả');
    }

    return request;
  }
}
