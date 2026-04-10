import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '@base/services/base.service';
import { ProductReview } from '@modules/ecommerce/entities/productReview.entity';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { OrderStatus } from '@modules/ecommerce/entities/order.entity';
import { CreateProductReviewDto } from '@modules/ecommerce/dtos/review.dto';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';
import { PaginatedResult } from '@base/dtos/paginated-result.dto';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';

@Injectable()
export class UserReviewService extends BaseService<ProductReview> {
  constructor(
    @InjectRepository(ProductReview)
    private readonly reviewRepo: Repository<ProductReview>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {
    super(reviewRepo, 'review');
  }

  async createReview(userId: number, dto: CreateProductReviewDto) {
    const orderItem = await this.orderItemRepo.findOne({
      where: { id: dto.orderItemId },
      relations: [
        'order',
        'order.user',
        'variant',
        'variant.product',
        'review',
      ],
    });

    if (!orderItem) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong đơn hàng');
    }
    if (orderItem.order.user.id !== userId) {
      throw new ForbiddenException('Bạn không thể đánh giá sản phẩm này');
    }
    const delivered =
      orderItem.order.orderStatus === OrderStatus.COMPLETED ||
      orderItem.order.shipmentStatus === ShipmentStatus.DELIVERED;

    if (!delivered) {
      throw new BadRequestException(
        'Đơn hàng chưa hoàn tất, chưa thể đánh giá',
      );
    }

    if (orderItem.review) {
      throw new BadRequestException('Bạn đã đánh giá sản phẩm này');
    }

    if (!orderItem.variant || !orderItem.variant.product) {
      throw new BadRequestException('Không xác định được sản phẩm để đánh giá');
    }

    const review = this.reviewRepo.create({
      order: orderItem.order,
      orderId: orderItem.order.id,
      orderItem,
      orderItemId: orderItem.id,
      product: orderItem.variant.product,
      productId: orderItem.variant.product.id,
      variant: orderItem.variant,
      variantId: orderItem.variant.id,
      user: { id: userId },
      userId,
      rating: dto.rating,
      comment: dto.comment,
    });

    return this.reviewRepo.save(review);
  }

  async listProductReviews(
    productId: number,
    query: QuerySpecificationDto,
  ): Promise<PaginatedResult<ProductReview>> {
    query.searchFields = ['comment', 'sellerReply'];
    return this.listPaginate(query, {
      where: { productId },
      relations: ['user', 'variant'],
    });
  }

  async checkCommentable(userId: number, orderItemId: number) {
    const orderItem = await this.orderItemRepo.findOne({
      where: { id: orderItemId },
      relations: [
        'order',
        'order.user',
        'variant',
        'variant.product',
        'review',
      ],
    });
    console.log(orderItem);
    if (!orderItem || orderItem.order.user.id !== userId) {
      throw new NotFoundException('Không tìm thấy sản phẩm tương ứng');
    }

    const delivered =
      orderItem.order.orderStatus === OrderStatus.COMPLETED ||
      orderItem.order.shipmentStatus === ShipmentStatus.DELIVERED;

    if (orderItem.review) {
      return {
        canComment: false,
        reason: 'Sản phẩm đã được đánh giá',
        reviewId: orderItem.review.id,
      };
    }

    if (!delivered) {
      return {
        canComment: false,
        reason: 'Đơn hàng chưa được giao hoàn tất',
      };
    }

    return {
      canComment: true,
    };
  }
}
