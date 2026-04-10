import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSize } from '@modules/ecommerce/entities/productSize.entity';
import {
  CreateProductSizeDto,
  UpdateProductSizeDto,
} from '@modules/ecommerce/dtos/product.dto';

@Injectable()
export class AdminProductSizeService {
  constructor(
    @InjectRepository(ProductSize)
    private readonly sizeRepo: Repository<ProductSize>,
  ) {}

  async create(dto: CreateProductSizeDto): Promise<ProductSize> {
    const existing = await this.sizeRepo.findOne({ where: { size: dto.size } });
    if (existing) throw new ConflictException('Size này đã tồn tại');
    const size = this.sizeRepo.create({ size: dto.size });
    return this.sizeRepo.save(size);
  }

  async update(dto: UpdateProductSizeDto): Promise<ProductSize> {
    const size = await this.sizeRepo.findOneBy({ id: dto.id });
    if (!size) throw new NotFoundException('Không tìm thấy size');
    if (dto.size && dto.size !== size.size) {
      const existing = await this.sizeRepo.findOne({
        where: { size: dto.size },
      });
      if (existing) throw new ConflictException('Size này đã tồn tại');
      size.size = dto.size;
    }
    return this.sizeRepo.save(size);
  }

  async delete(id: number): Promise<void> {
    const size = await this.sizeRepo.findOneBy({ id });
    if (!size) throw new NotFoundException('Không tìm thấy size');
    await this.sizeRepo.remove(size);
  }

  async findAll(): Promise<ProductSize[]> {
    return this.sizeRepo.find({ order: { size: 'ASC' } });
  }
}
