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
// import { ReasonDto } from '@modules/ecommerce/dtos/return-exchange.dto';
//
// @Injectable()
// export class AdminReturnWarrantyService {
//   constructor(
//     @InjectRepository(ReturnRequest)
//     private readonly returnRepo: Repository<ReturnRequest>,
//
//     @InjectRepository(WarrantyRequest)
//     private readonly warrantyRepo: Repository<WarrantyRequest>,
//   ) {}
//
//   // ----- RETURN -----
//   async approveReturn(id: number) {
//     const rr = await this.returnRepo.findOne({ where: { id } });
//     if (!rr) throw new NotFoundException('Return request không tồn tại');
//     rr.status = ReturnStatus.APPROVED;
//     return this.returnRepo.save(rr);
//   }
//
//   async rejectReturn(id: number, dto: ReasonDto) {
//     const rr = await this.returnRepo.findOne({ where: { id } });
//     if (!rr) throw new NotFoundException('Return request không tồn tại');
//     rr.status = ReturnStatus.REJECTED;
//     rr.rejectReason = dto.reason;
//     return this.returnRepo.save(rr);
//   }
//
//   async receiveReturn(id: number) {
//     const rr = await this.returnRepo.findOne({ where: { id } });
//     if (rr.status !== ReturnStatus.WAITING_FOR_CUSTOMER)
//       throw new BadRequestException('Chưa có hàng từ khách');
//     rr.status = ReturnStatus.RECEIVED;
//     return this.returnRepo.save(rr);
//   }
//
//   async completeReturn(id: number) {
//     const rr = await this.returnRepo.findOne({ where: { id } });
//     rr.status = ReturnStatus.COMPLETED;
//     return this.returnRepo.save(rr);
//   }
//
//   async listAllReturns() {
//     return this.returnRepo.find({
//       relations: ['orderItem', 'order', 'user', 'variant'],
//     });
//   }
//
//   async getReturnById(id: number) {
//     const request = await this.returnRepo.findOne({
//       where: { id },
//       relations: [
//         'order',
//         'order.user',
//         'orderItem',
//         'orderItem.variant',
//         'orderItem.variant.product',
//       ],
//     });
//
//     if (!request) {
//       throw new NotFoundException('Không tìm thấy yêu cầu hoàn trả');
//     }
//
//     return request;
//   }
//
//   // ----- WARRANTY -----
//   async approveWarranty(id: number) {
//     const wr = await this.warrantyRepo.findOne({ where: { id } });
//     wr.status = WarrantyStatus.APPROVED;
//     return this.warrantyRepo.save(wr);
//   }
//
//   async rejectWarranty(id: number, dto: ReasonDto) {
//     const wr = await this.warrantyRepo.findOne({ where: { id } });
//     wr.status = WarrantyStatus.REJECTED;
//     wr.rejectReason = dto.reason;
//     return this.warrantyRepo.save(wr);
//   }
//
//   async startWarranty(id: number) {
//     const wr = await this.warrantyRepo.findOne({ where: { id } });
//     wr.status = WarrantyStatus.PROCESSING;
//     return this.warrantyRepo.save(wr);
//   }
//
//   async completeWarranty(id: number, result: string) {
//     const wr = await this.warrantyRepo.findOne({ where: { id } });
//     wr.status = WarrantyStatus.COMPLETED;
//     wr.warrantyResult = result;
//     return this.warrantyRepo.save(wr);
//   }
//
//   async listAllWarranties() {
//     return this.warrantyRepo.find({
//       relations: ['orderItem', 'order', 'user', 'variant'],
//     });
//   }
// }
