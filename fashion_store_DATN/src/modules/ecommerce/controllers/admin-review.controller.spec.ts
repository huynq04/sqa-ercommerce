// admin-review.controller.spec.ts
// Unit tests for AdminReviewController

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdminReviewController } from './admin-review.controller';
import { AdminReviewService } from '@modules/ecommerce/services/admin-review.service';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';

const mockReviewService = {
  listAll: jest.fn(),
  reply: jest.fn(),
  getById: jest.fn(),
};

describe('AdminReviewController', () => {
  let controller: AdminReviewController;
  let service: typeof mockReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReviewController],
      providers: [{ provide: AdminReviewService, useValue: mockReviewService }],
    }).compile();

    controller = module.get<AdminReviewController>(AdminReviewController);
    service = module.get(AdminReviewService) as any;
    jest.clearAllMocks();
  });

  // TC-BE-REVIEW-CTRL-01: Lấy danh sách review (success)
  it('should return list from service', async () => {
    const query: QuerySpecificationDto = { page: 1, limit: 10 } as any;
    const expected = { data: [{ id: 1 }], total: 1 } as any;
    service.listAll.mockResolvedValue(expected);
    const res = await controller.list(query);
    expect(service.listAll).toHaveBeenCalledWith(query);
    expect(res).toBe(expected);
  });

  // TC-BE-REVIEW-CTRL-02: Reply review (success)
  it('should call reply on service', async () => {
    const expected = { id: 2 } as any;
    service.reply.mockResolvedValue(expected);
    const res = await controller.reply(2, { reply: 'ok' } as any);
    expect(service.reply).toHaveBeenCalledWith(2, { reply: 'ok' });
    expect(res).toBe(expected);
  });

  // TC-BE-REVIEW-CTRL-03: getById (success)
  it('should return review by id', async () => {
    const expected = { id: 3 } as any;
    service.getById.mockResolvedValue(expected);
    const res = await controller.getById(3);
    expect(service.getById).toHaveBeenCalledWith(3);
    expect(res).toBe(expected);
  });

  // TC-BE-REVIEW-CTRL-04: service throws (error)
  it('should propagate service error', async () => {
    service.getById.mockRejectedValue(new Error('Service error'));
    await expect(controller.getById(999)).rejects.toThrow('Service error');
  });

  // TC-BE-REVIEW-CTRL-05: dto rỗng vẫn được truyền vào service (negative)
  it('should pass empty dto to reply', async () => {
    await expect(controller.reply(6, {} as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(service.reply).not.toHaveBeenCalled();
  });

  // TC-BE-REVIEW-CTRL-06: query undefined vẫn được truyền vào service (negative)
  it('should pass undefined query to list', async () => {
    await expect(controller.list(undefined as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(service.listAll).not.toHaveBeenCalled();
  });
});
