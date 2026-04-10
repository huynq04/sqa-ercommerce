import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { BaseService } from '@base/services/base.service';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';
import { ActivityLog } from '@modules/ecommerce/entities/activityLog.entity';

@Injectable()
export class UserProductService extends BaseService<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
  ) {
    super(productRepo, 'product');
  }

  async findAll(query?: QuerySpecificationDto) {
    query.searchFields = ['name', 'description'];
    return this.listPaginate(query, {
      relations: [
        'category',
        'variants',
        'variants.color',
        'variants.size',
        'images',
      ],
    });
  }

  /** – Lấy chi tiết sản phẩm theo ID */
  async findById(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: [
        'category',
        'variants',
        'variants.color',
        'variants.size',
        'images',
      ],
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return product;
  }

  async searchByKeyword(keyword: string): Promise<Product[]> {
    return this.productRepo.find({
      where: [
        { name: ILike(`%${keyword}%`) },
        { description: ILike(`%${keyword}%`) },
      ],
      take: 5,
    });
  }

  async logProductView(userId: number, productId: number) {
    if (!userId || !productId) return;

    const criteria = {
      userId,
      action: 'view',
      entityType: 'product',
      entityId: productId,
    };

    const updateResult = await this.activityLogRepo
      .createQueryBuilder()
      .update(ActivityLog)
      .set({
        viewCount: () => 'view_count + 1',
        updatedAt: () => 'NOW()',
      })
      .where(
        'user_id = :userId AND action = :action AND entity_type = :entityType AND entity_id = :entityId',
        criteria,
      )
      .execute();

    if (updateResult.affected) return;

    try {
      await this.activityLogRepo
        .createQueryBuilder()
        .insert()
        .values({
          user: { id: userId },
          action: 'view',
          entityType: 'product',
          entityId: productId,
          viewCount: 1,
        })
        .execute();
    } catch (_err) {
      await this.activityLogRepo
        .createQueryBuilder()
        .update(ActivityLog)
        .set({
          viewCount: () => 'view_count + 1',
          updatedAt: () => 'NOW()',
        })
        .where(
          'user_id = :userId AND action = :action AND entity_type = :entityType AND entity_id = :entityId',
          criteria,
        )
        .execute();
    }
  }
}
