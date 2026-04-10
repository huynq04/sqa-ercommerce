import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductColor } from '@modules/ecommerce/entities/productColor.entity';
import {
  CreateProductColorDto,
  UpdateProductColorDto,
} from '@modules/ecommerce/dtos/product.dto';

@Injectable()
export class AdminProductColorService {
  constructor(
    @InjectRepository(ProductColor)
    private readonly colorRepo: Repository<ProductColor>,
  ) {}

  async create(dto: CreateProductColorDto): Promise<ProductColor> {
    const existing = await this.colorRepo.findOne({
      where: { color: dto.color },
    });
    if (existing) throw new ConflictException('Màu này đã tồn tại');
    const color = this.colorRepo.create({ color: dto.color });
    return this.colorRepo.save(color);
  }

  async update(dto: UpdateProductColorDto): Promise<ProductColor> {
    const color = await this.colorRepo.findOneBy({ id: dto.id });
    if (!color) throw new NotFoundException('Không tìm thấy màu');
    if (dto.color && dto.color !== color.color) {
      const existing = await this.colorRepo.findOne({
        where: { color: dto.color },
      });
      if (existing) throw new ConflictException('Màu này đã tồn tại');
      color.color = dto.color;
    }
    return this.colorRepo.save(color);
  }

  async delete(id: number): Promise<void> {
    const color = await this.colorRepo.findOneBy({ id });
    if (!color) throw new NotFoundException('Không tìm thấy màu');
    await this.colorRepo.remove(color);
  }

  async findAll(): Promise<ProductColor[]> {
    return this.colorRepo.find({ order: { color: 'ASC' } });
  }
}
