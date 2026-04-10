import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { CreateReturnDto } from '@modules/ecommerce/dtos/return-exchange.dto';
import { ExchangeRequest } from '@modules/ecommerce/entities/exchangeRequest.entity';
import { ExchangeStatus } from '@modules/ecommerce/enums/exchangeStatus.enum';

@Injectable()
export class UserExchangeRequestService {
  constructor(
    @InjectRepository(ExchangeRequest)
    private readonly exchangeRepo: Repository<ExchangeRequest>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  async createReturn(dto: CreateReturnDto, userId: number) {
    const item = await this.orderItemRepo.findOne({
      where: { id: dto.orderItemId },
      relations: ['order'],
    });
    if (!item) throw new NotFoundException('Order item không tồn tại');

    const createdAt = new Date(item.order.updatedAt);
    const now = new Date();
    if ((now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24) > 7) {
      throw new BadRequestException('Quá hạn 7 ngày không thể đổi trả');
    }

    const existed = await this.exchangeRepo.findOne({
      where: {
        orderItemId: dto.orderItemId,
        userId,
      },
    });

    if (existed) {
      if (existed.status === ExchangeStatus.REJECTED) {
        throw new BadRequestException(
          'Yêu cầu đổi hàng đã bị từ chối và không thể gửi lại',
        );
      }
      throw new BadRequestException('Sản phẩm này đã có yêu cầu đổi hàng');
    }
    const rr = this.exchangeRepo.create({
      ...dto,
      orderItemId: dto.orderItemId,
      userId,
      status: ExchangeStatus.PENDING,
    });

    return this.exchangeRepo.save(rr);
  }

  async listUserExchanges(userId: number) {
    return this.exchangeRepo.find({
      where: { userId },
      relations: ['orderItem'],
    });
  }
}
