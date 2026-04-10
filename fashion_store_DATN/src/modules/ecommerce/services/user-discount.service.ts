import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { DiscountCode } from '@modules/ecommerce/entities/discountCode.entity';
import { ApplyDiscountDto } from '../dtos/discount.dto';

@Injectable()
export class UserDiscountService {
  constructor(
    @InjectRepository(DiscountCode)
    private readonly discountRepo: Repository<DiscountCode>,
  ) {}

  /** Lấy danh sách các mã đang hoạt động */
  // async getActiveDiscounts(): Promise<DiscountCode[]> {
  //     const now = new Date();
  //     return this.discountRepo.find({
  //         where: {
  //             startDate: LessThanOrEqual(now),
  //             endDate: MoreThanOrEqual(now),
  //         },
  //         order: { createdAt: 'DESC' },
  //     });
  // }

  /** Áp dụng mã giảm giá cho người dùng */
  async getAllDiscounts(): Promise<DiscountCode[]> {
    return this.discountRepo.find({ order: { createdAt: 'DESC' } });
  }

  async applyDiscount(dto: ApplyDiscountDto) {
    const discount = await this.discountRepo.findOne({
      where: { code: dto.code },
    });
    if (!discount) throw new NotFoundException('Mã giảm giá không hợp lệ');

    const now = new Date();
    const start = new Date(discount.startDate as unknown as string);
    const end = new Date(discount.endDate as unknown as string);
    end.setHours(23, 59, 59, 999);
    if (start > now || end < now) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }
    if (discount.usageLimit > 0 && discount.usedCount >= discount.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã được sử dụng tối đa');
    }

    const discountAmount = (dto.totalAmount * discount.discountPercent) / 100;
    const newTotal = dto.totalAmount - discountAmount;

    return {
      code: discount.code,
      discountPercent: discount.discountPercent,
      discountAmount,
      newTotal,
    };
  }
}
