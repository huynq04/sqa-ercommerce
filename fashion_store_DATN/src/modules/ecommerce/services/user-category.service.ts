import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '@modules/ecommerce/entities/category.entity';
import { BaseService } from '@base/services/base.service';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';

@Injectable()
export class UserCategoryService extends BaseService<Category> {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {
    super(categoryRepo, 'category');
  }

  async findAll(query?: QuerySpecificationDto) {
    // Chỉ cho phép search theo name & description
    query.searchFields = ['name', 'description'];

    return this.listPaginate(query, {
      relations: ['parent', 'children', 'products'],
    });
  }

  async findById(id: number) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['parent', 'children', 'products'],
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    return category;
  }
}
