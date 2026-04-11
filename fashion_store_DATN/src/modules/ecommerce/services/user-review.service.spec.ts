import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserReviewService } from './user-review.service';
import { ProductReview } from '../entities/productReview.entity';
import { OrderItem } from '../entities/orderItem.entity';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { OrderStatus } from '../entities/order.entity';
import { ShipmentStatus } from '../enums/shipmentStatus.enum';

describe('UserReviewService', () => {
  let service: UserReviewService;
  let reviewRepo: any;
  let orderItemRepo: any;

  beforeEach(async () => {
    reviewRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    orderItemRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserReviewService,
        { provide: getRepositoryToken(ProductReview), useValue: reviewRepo },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepo },
      ],
    }).compile();

    service = module.get<UserReviewService>(UserReviewService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createReview', () => {
    const dto = { orderItemId: 1, rating: 5, comment: 'nice' } as any;

    // Nếu orderItem không tồn tại -> NotFoundException
    it('throws NotFoundException when order item not found', async () => {
      orderItemRepo.findOne.mockResolvedValue(undefined);
      await expect(service.createReview(1, dto)).rejects.toThrow(NotFoundException);
    });

    // Nếu user không phải chủ đơn hàng -> ForbiddenException
    it('throws ForbiddenException when user mismatch', async () => {
      const orderItem = {
        id: 1,
        order: { user: { id: 2 }, orderStatus: OrderStatus.COMPLETED, shipmentStatus: ShipmentStatus.DELIVERED },
        variant: { id: 3, product: { id: 10 } },
        review: null,
      } as any;
      orderItemRepo.findOne.mockResolvedValue(orderItem);
      await expect(service.createReview(1, dto)).rejects.toThrow(ForbiddenException);
    });

    // Nếu đơn hàng chưa giao hoàn tất -> BadRequestException
    it('throws BadRequestException when not delivered', async () => {
      const orderItem = {
        id: 1,
        order: { user: { id: 1 }, orderStatus: OrderStatus.PENDING, shipmentStatus: ShipmentStatus.READY_TO_PICK },
        variant: { id: 3, product: { id: 10 } },
        review: null,
      } as any;
      orderItemRepo.findOne.mockResolvedValue(orderItem);
      await expect(service.createReview(1, dto)).rejects.toThrow(BadRequestException);
    });

    // Nếu đã đánh giá trước đó -> BadRequestException
    it('throws BadRequestException when already reviewed', async () => {
      const orderItem = {
        id: 1,
        order: { user: { id: 1 }, orderStatus: OrderStatus.COMPLETED, shipmentStatus: ShipmentStatus.DELIVERED },
        variant: { id: 3, product: { id: 10 } },
        review: { id: 99 },
      } as any;
      orderItemRepo.findOne.mockResolvedValue(orderItem);
      await expect(service.createReview(1, dto)).rejects.toThrow(BadRequestException);
    });

    // Nếu không xác định được variant hoặc product -> BadRequestException
    it('throws BadRequestException when variant or product missing', async () => {
      const orderItem = {
        id: 1,
        order: { user: { id: 1 }, orderStatus: OrderStatus.COMPLETED, shipmentStatus: ShipmentStatus.DELIVERED },
        variant: null,
        review: null,
      } as any;
      orderItemRepo.findOne.mockResolvedValue(orderItem);
      await expect(service.createReview(1, dto)).rejects.toThrow(BadRequestException);
    });

    // Tạo review mới và lưu khi dữ liệu hợp lệ
    it('creates and saves review when valid', async () => {
      const order = { id: 5, user: { id: 1 }, orderStatus: OrderStatus.COMPLETED, shipmentStatus: ShipmentStatus.DELIVERED } as any;
      const variant = { id: 3, product: { id: 10 } } as any;
      const orderItem = { id: 1, order, variant, review: null } as any;
      const created = { rating: dto.rating, comment: dto.comment } as any;
      const saved = { id: 77, ...created } as any;

      orderItemRepo.findOne.mockResolvedValue(orderItem);
      reviewRepo.create.mockReturnValue(created);
      reviewRepo.save.mockResolvedValue(saved);

      const res = await service.createReview(1, dto);
      expect(reviewRepo.create).toHaveBeenCalled();
      expect(reviewRepo.save).toHaveBeenCalledWith(created);
      expect(res).toBe(saved);
    });
  });

  describe('listProductReviews', () => {
    // Kiểm tra listProductReviews gọi listPaginate với options đúng
    it('forwards to listPaginate with correct options', async () => {
      const spy = jest.spyOn(service as any, 'listPaginate').mockResolvedValue({ items: [], total: 0 } as any);
      const query = {} as any;
      const res = await service.listProductReviews(10, query);
      expect(spy).toHaveBeenCalledWith(query, { where: { productId: 10 }, relations: ['user', 'variant'] });
      expect(res).toEqual({ items: [], total: 0 });
    });
  });

  describe('checkCommentable', () => {
    // Nếu không tìm thấy hoặc user khác -> NotFoundException
    it('throws NotFoundException when order item missing or user mismatch', async () => {
      orderItemRepo.findOne.mockResolvedValue(undefined);
      await expect(service.checkCommentable(1, 1)).rejects.toThrow(NotFoundException);

      const oi = { id: 1, order: { user: { id: 2 } } } as any;
      orderItemRepo.findOne.mockResolvedValue(oi);
      await expect(service.checkCommentable(1, 1)).rejects.toThrow(NotFoundException);
    });

    // Nếu đã đánh giá -> trả về canComment false và reviewId
    it('returns cannot comment when review exists', async () => {
      const oi = { id: 1, order: { user: { id: 1 } }, review: { id: 55 }, orderStatus: OrderStatus.COMPLETED } as any;
      orderItemRepo.findOne.mockResolvedValue(oi);
      const res = await service.checkCommentable(1, 1);
      expect(res).toEqual({ canComment: false, reason: 'Sản phẩm đã được đánh giá', reviewId: 55 });
    });

    // Nếu chưa giao -> trả về canComment false với lý do
    it('returns cannot comment when not delivered', async () => {
      const oi = { id: 1, order: { user: { id: 1 }, orderStatus: OrderStatus.PENDING, shipmentStatus: ShipmentStatus.READY_TO_PICK }, review: null } as any;
      orderItemRepo.findOne.mockResolvedValue(oi);
      const res = await service.checkCommentable(1, 1);
      expect(res).toEqual({ canComment: false, reason: 'Đơn hàng chưa được giao hoàn tất' });
    });

    // Nếu đã giao và chưa có review -> canComment true
    it('returns canComment true when delivered and no review', async () => {
      const oi = { id: 1, order: { user: { id: 1 }, orderStatus: OrderStatus.COMPLETED, shipmentStatus: ShipmentStatus.DELIVERED }, review: null } as any;
      orderItemRepo.findOne.mockResolvedValue(oi);
      const res = await service.checkCommentable(1, 1);
      expect(res).toEqual({ canComment: true });
    });
  });
});
