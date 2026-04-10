import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '@base/services/base.service';
import { ProductReview } from '@modules/ecommerce/entities/productReview.entity';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';
import { PaginatedResult } from '@base/dtos/paginated-result.dto';
import { SellerReplyReviewDto } from '@modules/ecommerce/dtos/review.dto';

@Injectable()
export class AdminReviewService extends BaseService<ProductReview> {
  constructor(
    @InjectRepository(ProductReview)
    private readonly reviewRepo: Repository<ProductReview>,
  ) {
    super(reviewRepo, 'review');
  }

  async listAll(
    query: QuerySpecificationDto,
  ): Promise<PaginatedResult<ProductReview>> {
    query.searchFields = ['comment', 'sellerReply'];
    return this.listPaginate(query, {
      relations: ['user', 'product', 'order', 'variant', 'orderItem'],
    });
  }

  async reply(reviewId: number, dto: SellerReplyReviewDto) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');

    review.sellerReply = dto.reply;
    review.sellerRepliedAt = new Date();
    return this.reviewRepo.save(review);
  }

  // async getById(id: number) {
  //   const review = await this.reviewRepo.findOne({
  //     where: { id },
  //     relations: ['user', 'product', 'variant', 'orderItem'],
  //   });
  //
  //   if (!review) {
  //     throw new NotFoundException('Review not found');
  //   }
  //
  //   return review;
  // }
  async getById(id: number) {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: {
        user: true,
        product: true,
        variant: true,
        orderItem: true,
      },
      select: {
        user: {
          id: true,
          name: true,
          email: true,
          address: true,
          phone: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }
}
