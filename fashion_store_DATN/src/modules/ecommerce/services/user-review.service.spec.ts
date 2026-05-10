import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserReviewService } from './user-review.service';
import { ProductReview } from '../entities/productReview.entity';
import { OrderItem } from '../entities/orderItem.entity';
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

  it('TC-USER-REVIEW-SERVICE-001 - throws NotFoundException when order item not found', async () => {
    orderItemRepo.findOne.mockResolvedValue(undefined);

    await expect(
      service.createReview(1, { orderItemId: 1 } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('TC-USER-REVIEW-SERVICE-002 - throws ForbiddenException when user mismatch', async () => {
    orderItemRepo.findOne.mockResolvedValue({
      id: 1,
      order: {
        user: { id: 2 },
        orderStatus: OrderStatus.COMPLETED,
        shipmentStatus: ShipmentStatus.DELIVERED,
      },
      variant: { id: 10, product: { id: 20 } },
      review: null,
    });

    await expect(
      service.createReview(1, { orderItemId: 1 } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('TC-USER-REVIEW-SERVICE-003 - throws BadRequestException when not delivered', async () => {
    orderItemRepo.findOne.mockResolvedValue({
      id: 1,
      order: {
        user: { id: 1 },
        orderStatus: OrderStatus.PENDING,
        shipmentStatus: ShipmentStatus.READY_TO_PICK,
      },
      variant: { id: 10, product: { id: 20 } },
      review: null,
    });

    await expect(
      service.createReview(1, { orderItemId: 1 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-USER-REVIEW-SERVICE-004 - throws BadRequestException when review already exists', async () => {
    orderItemRepo.findOne.mockResolvedValue({
      id: 1,
      order: {
        user: { id: 1 },
        orderStatus: OrderStatus.COMPLETED,
        shipmentStatus: ShipmentStatus.DELIVERED,
      },
      variant: { id: 10, product: { id: 20 } },
      review: { id: 77 },
    });

    await expect(
      service.createReview(1, { orderItemId: 1 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-USER-REVIEW-SERVICE-005 - throws BadRequestException when variant or product missing', async () => {
    orderItemRepo.findOne.mockResolvedValue({
      id: 1,
      order: {
        user: { id: 1 },
        orderStatus: OrderStatus.COMPLETED,
        shipmentStatus: ShipmentStatus.DELIVERED,
      },
      variant: null,
      review: null,
    });

    await expect(
      service.createReview(1, { orderItemId: 1 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-USER-REVIEW-SERVICE-006 - creates and saves review when valid', async () => {
    const orderItem = {
      id: 1,
      order: {
        id: 5,
        user: { id: 1 },
        orderStatus: OrderStatus.COMPLETED,
        shipmentStatus: ShipmentStatus.DELIVERED,
      },
      variant: { id: 10, product: { id: 20 } },
      review: null,
    };

    orderItemRepo.findOne.mockResolvedValue(orderItem);
    reviewRepo.create.mockReturnValue({ rating: 5, comment: 'ok' });
    reviewRepo.save.mockResolvedValue({ id: 99, rating: 5, comment: 'ok' });

    const result = await service.createReview(1, {
      orderItemId: 1,
      rating: 5,
      comment: 'ok',
    } as any);

    expect(reviewRepo.create).toHaveBeenCalled();
    expect(reviewRepo.save).toHaveBeenCalled();
    expect(result).toEqual({ id: 99, rating: 5, comment: 'ok' });
  });

  it('TC-USER-REVIEW-SERVICE-007 - forwards to listPaginate with correct options', async () => {
    const spy = jest.spyOn(service as any, 'listPaginate').mockResolvedValue({
      items: [],
      total: 0,
    });
    const query = {} as any;

    const result = await service.listProductReviews(10, query);

    expect(query.searchFields).toEqual(['comment', 'sellerReply']);
    expect(spy).toHaveBeenCalledWith(query, {
      where: { productId: 10 },
      relations: ['user', 'variant'],
    });
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('TC-USER-REVIEW-SERVICE-008 - ném lỗi khi query bị undefined', async () => {
    // Mock listPaginate (dù thực tế sẽ không chạy tới đây)
    const spy = jest.spyOn(service as any, 'listPaginate');

    // Kiểm tra hàm ném lỗi vì không thể gán searchFields vào undefined
    await expect(
      service.listProductReviews(10, undefined as any),
    ).rejects.toThrow();

    // Đảm bảo không gọi xuống tầng database/pagination
    expect(spy).not.toHaveBeenCalled();
  });

  it('TC-USER-REVIEW-SERVICE-009 - ném lỗi khi productId bị undefined', async () => {
    const spy = jest.spyOn(service as any, 'listPaginate');
    const query = { searchFields: [] } as any;

    // Kiểm tra hàm ném lỗi khi productId không hợp lệ
    // Lưu ý: Nếu bạn dùng Error custom, hãy truyền string lỗi vào .toThrow('...')
    await expect(
      service.listProductReviews(undefined as any, query),
    ).rejects.toThrow();

    // Quan trọng: Xác nhận logic đã bị chặn lại ngay từ đầu
    expect(spy).not.toHaveBeenCalled();
  });

  it('TC-USER-REVIEW-SERVICE-010 - returns cannot comment when review exists', async () => {
    orderItemRepo.findOne.mockResolvedValue({
      id: 1,
      order: {
        user: { id: 1 },
        orderStatus: OrderStatus.COMPLETED,
        shipmentStatus: ShipmentStatus.DELIVERED,
      },
      review: { id: 77 },
    });

    const result = await service.checkCommentable(1, 1);

    expect(result).toEqual(
      expect.objectContaining({
        canComment: false,
        reviewId: 77,
      }),
    );
  });

  it('TC-USER-REVIEW-SERVICE-011 - returns cannot comment when not delivered', async () => {
    orderItemRepo.findOne.mockResolvedValue({
      id: 1,
      order: {
        user: { id: 1 },
        orderStatus: OrderStatus.PENDING,
        shipmentStatus: ShipmentStatus.READY_TO_PICK,
      },
      review: null,
    });

    const result = await service.checkCommentable(1, 1);

    expect(result).toEqual({
      canComment: false,
      reason: 'Đơn hàng chưa được giao hoàn tất',
    });
  });

  it('TC-USER-REVIEW-SERVICE-012 - returns canComment true when delivered and no review', async () => {
    orderItemRepo.findOne.mockResolvedValue({
      id: 1,
      order: {
        user: { id: 1 },
        orderStatus: OrderStatus.COMPLETED,
        shipmentStatus: ShipmentStatus.DELIVERED,
      },
      review: null,
    });

    const result = await service.checkCommentable(1, 1);

    expect(result).toEqual({ canComment: true });
  });

  it('TC-USER-REVIEW-SERVICE-013 - throws NotFoundException when order item missing', async () => {
    orderItemRepo.findOne.mockResolvedValue(undefined);

    await expect(service.checkCommentable(1, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('TC-USER-REVIEW-SERVICE-014 - throws NotFoundException when user mismatch', async () => {
    orderItemRepo.findOne.mockResolvedValue({
      id: 1,
      order: {
        user: { id: 2 },
        orderStatus: OrderStatus.COMPLETED,
        shipmentStatus: ShipmentStatus.DELIVERED,
      },
      review: null,
    });

    await expect(service.checkCommentable(1, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
