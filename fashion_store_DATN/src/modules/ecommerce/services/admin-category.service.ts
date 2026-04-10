import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '@modules/ecommerce/entities/category.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@modules/ecommerce/dtos/category.dto';

@Injectable()
export class AdminCategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  /** Tạo danh mục mới */
  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Tên danh mục đã tồn tại');

    let parent: Category = null;
    if (dto.parentId) {
      parent = await this.categoryRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Không tìm thấy danh mục cha');
    }

    const category = this.categoryRepo.create({
      name: dto.name,
      description: dto.description,
      parent,
    });

    return this.categoryRepo.save(category);
  }

  /** Cập nhật danh mục */
  async update(dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.id },
      relations: ['parent', 'children', 'products'],
    });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');

    if (dto.parentId) {
      const parent = await this.categoryRepo.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException('Không tìm thấy danh mục cha');
      category.parent = parent;
    }

    Object.assign(category, {
      name: dto.name ?? category.name,
      description: dto.description ?? category.description,
    });

    return this.categoryRepo.save(category);
  }

  /** Xóa danh mục (chỉ khi không có sản phẩm con) */
  async delete(id: number): Promise<void> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    if (category.products?.length > 0) {
      throw new ConflictException('Không thể xóa danh mục đang có sản phẩm');
    }

    await this.categoryRepo.remove(category);
  }
}
