// admin-review.service.spec.ts
// Unit tests for AdminReviewService
// TC comments use format: // TC-BE-...

import { NotFoundException } from '@nestjs/common';
import { AdminReviewService } from './admin-review.service';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';

const mockReviewRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

describe('AdminReviewService', () => {
  let service: AdminReviewService;
  let reviewRepo: ReturnType<typeof mockReviewRepo>;

  beforeEach(() => {
    reviewRepo = mockReviewRepo();
    service = new AdminReviewService(reviewRepo as any);
    // mock listPaginate coming from BaseService
    service.listPaginate = jest.fn();
  });

  // TC-BE-REVIEW-01: Lấy danh sách review (success)
  it('should return paginated reviews (listAll)', async () => {
    const query: QuerySpecificationDto = { page: 1, limit: 10 } as any;
    const expected = { data: [{ id: 1 }], total: 1 } as any;
    (service.listPaginate as jest.Mock).mockResolvedValue(expected);

    const result = await service.listAll(query);

    expect(service.listPaginate).toHaveBeenCalledWith(query, {
      relations: ['user', 'product', 'order', 'variant', 'orderItem'],
    });
    expect(result).toBe(expected);
  });

  // TC-BE-REVIEW-02: Lấy danh sách review - lỗi từ listPaginate (error)
  it('should propagate error from listPaginate', async () => {
    const query: QuerySpecificationDto = { page: 1, limit: 10 } as any;
    (service.listPaginate as jest.Mock).mockRejectedValue(new Error('DB failure'));
    await expect(service.listAll(query)).rejects.toThrow('DB failure');
  });

  // TC-BE-REVIEW-03: Reply review thành công (success)
  it('should reply to a review and set sellerRepliedAt', async () => {
    const existing = { id: 1, sellerReply: null, sellerRepliedAt: null } as any;
    reviewRepo.findOne.mockResolvedValue(existing);
    reviewRepo.save.mockImplementation(async (r: any) => r);

    const dto = { reply: 'Thank you' } as any;
    const res = await service.reply(1, dto);

    expect(reviewRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(res.sellerReply).toBe(dto.reply);
    expect(res.sellerRepliedAt).toBeInstanceOf(Date);
  });

  // TC-BE-REVIEW-04: Reply review không tồn tại (error)
  it('should throw NotFoundException when replying to non-existing review', async () => {
    reviewRepo.findOne.mockResolvedValue(undefined);
    await expect(service.reply(999, { reply: 'x' } as any)).rejects.toThrow(NotFoundException);
  });

  // TC-BE-REVIEW-05: getById success (success)
  it('should return review by id with relations (getById)', async () => {
    const review = { id: 2, user: {}, product: {} } as any;
    reviewRepo.findOne.mockResolvedValue(review);

    const res = await service.getById(2);

    expect(reviewRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 } }),
    );
    expect(res).toBe(review);
  });

  // TC-BE-REVIEW-06: getById not found (error)
  it('should throw NotFoundException when getById not found', async () => {
    reviewRepo.findOne.mockResolvedValue(undefined);
    await expect(service.getById(3)).rejects.toThrow(NotFoundException);
  });
});
