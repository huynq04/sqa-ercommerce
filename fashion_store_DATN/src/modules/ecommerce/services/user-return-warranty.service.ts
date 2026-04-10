// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import {
//   ReturnRequest,
//   ReturnStatus,
// } from '@modules/ecommerce/entities/returnRequest.entity';
// import {
//   WarrantyRequest,
//   WarrantyStatus,
// } from '@modules/ecommerce/entities/warrantyRequest.entity';
// import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
// import { CreateReturnDto } from '@modules/ecommerce/dtos/return-exchange.dto';
// import { CreateWarrantyDto } from '@modules/ecommerce/dtos/return-exchange.dto';
//
// @Injectable()
// export class UserReturnWarrantyService {
//   constructor(
//     @InjectRepository(ReturnRequest)
//     private readonly returnRepo: Repository<ReturnRequest>,
//
//     @InjectRepository(WarrantyRequest)
//     private readonly warrantyRepo: Repository<WarrantyRequest>,
//
//     @InjectRepository(OrderItem)
//     private readonly orderItemRepo: Repository<OrderItem>,
//   ) {}
//
//   // ----- RETURN -----
//   async createReturn(dto: CreateReturnDto, userId: number) {
//     const item = await this.orderItemRepo.findOne({
//       where: { id: dto.orderItemId },
//       relations: ['order'],
//     });
//     if (!item) throw new NotFoundException('Order item không tồn tại');
//
//     const createdAt = new Date(item.order.createdAt);
//     const now = new Date();
//     if ((now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24) > 7) {
//       throw new BadRequestException('Quá hạn 7 ngày không thể đổi trả');
//     }
//
//     const rr = this.returnRepo.create({
//       ...dto,
//       orderId: dto.orderId,
//       orderItemId: dto.orderItemId,
//       variantId: dto.variantId,
//       userId,
//       status: ReturnStatus.PENDING,
//     });
//
//     return this.returnRepo.save(rr);
//   }
//
//   async shipReturn(id: number, shippingCode: string) {
//     const rr = await this.returnRepo.findOne({ where: { id } });
//     if (!rr) throw new NotFoundException('Return request không tồn tại');
//     if (rr.status !== ReturnStatus.APPROVED)
//       throw new BadRequestException('Return request chưa được duyệt');
//     rr.shippingCode = shippingCode;
//     rr.status = ReturnStatus.WAITING_FOR_CUSTOMER;
//     return this.returnRepo.save(rr);
//   }
//
//   async createWarranty(dto: CreateWarrantyDto, userId: number) {
//     const item = await this.orderItemRepo.findOne({
//       where: { id: dto.orderItemId },
//     });
//     if (!item) throw new NotFoundException('Order item không tồn tại');
//
//     const wr = this.warrantyRepo.create({
//       ...dto,
//       orderId: dto.orderId,
//       orderItemId: dto.orderItemId,
//       variantId: dto.variantId,
//       userId,
//       status: WarrantyStatus.PENDING,
//     });
//     return this.warrantyRepo.save(wr);
//   }
//
//   async shipWarranty(id: number, shippingCode: string) {
//     const wr = await this.warrantyRepo.findOne({ where: { id } });
//     if (!wr) throw new NotFoundException('Warranty request không tồn tại');
//     if (wr.status !== WarrantyStatus.APPROVED)
//       throw new BadRequestException('Warranty request chưa được duyệt');
//     wr.shippingCode = shippingCode;
//     wr.status = WarrantyStatus.RECEIVED;
//     return this.warrantyRepo.save(wr);
//   }
//
//   async listUserReturns(userId: number) {
//     return this.returnRepo.find({
//       where: { userId },
//       relations: ['orderItem', 'order', 'variant'],
//     });
//   }
//
//   async listUserWarranties(userId: number) {
//     return this.warrantyRepo.find({
//       where: { userId },
//       relations: ['orderItem', 'order', 'variant'],
//     });
//   }
// }
