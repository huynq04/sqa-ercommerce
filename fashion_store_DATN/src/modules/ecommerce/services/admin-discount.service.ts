import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscountCode } from '@modules/ecommerce/entities/discountCode.entity';
import { CreateDiscountDto, UpdateDiscountDto } from '../dtos/discount.dto';

@Injectable()
export class AdminDiscountService {
  constructor(
    @InjectRepository(DiscountCode)
    private readonly discountRepo: Repository<DiscountCode>,
  ) {}

  async findAll(): Promise<DiscountCode[]> {
    return this.discountRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<DiscountCode> {
    const discount = await this.discountRepo.findOne({ where: { id } });
    if (!discount)
      throw new NotFoundException(`Không tìm thấy mã giảm giá ID: ${id}`);
    return discount;
  }

  async create(dto: CreateDiscountDto): Promise<DiscountCode> {
    const exists = await this.discountRepo.findOne({
      where: { code: dto.code },
    });
    if (exists) throw new NotFoundException('Mã giảm giá này đã tồn tại');
    const discount = this.discountRepo.create(dto);
    return this.discountRepo.save(discount);
  }

  async update(id: number, dto: UpdateDiscountDto): Promise<DiscountCode> {
    const discount = await this.findOne(id);
    Object.assign(discount, dto);
    return this.discountRepo.save(discount);
  }

  async remove(id: number): Promise<{ message: string }> {
    const discount = await this.findOne(id);
    await this.discountRepo.remove(discount);
    return { message: `Đã xóa mã giảm giá "${discount.code}"` };
  }
}
