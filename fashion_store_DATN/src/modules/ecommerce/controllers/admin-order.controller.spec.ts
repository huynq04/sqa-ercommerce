// admin-order.controller.spec.ts
// Unit tests for AdminOrderController
// Sử dụng Jest và @nestjs/testing

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdminOrderController } from './admin-order.controller';
import { AdminOrderService } from '../services/admin-order.service';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';

// Mock AdminOrderService
const mockOrderService = {
  listAll: jest.fn(),
};

describe('AdminOrderController', () => {
  let controller: AdminOrderController;
  let service: typeof mockOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminOrderController],
      providers: [
        { provide: AdminOrderService, useValue: mockOrderService },
      ],
    }).compile();

    controller = module.get<AdminOrderController>(AdminOrderController);
    service = module.get(AdminOrderService);
    jest.clearAllMocks();
  });

  // TC-BE-ORDER-CTRL-01: Trả về danh sách order khi gọi API (success)
  it('should return orders from service', async () => {
    const query: QuerySpecificationDto = { page: 1, limit: 10 } as any;
    const expected = { data: [{ id: 1 }], total: 1 };
    service.listAll.mockResolvedValue(expected);
    const result = await controller.list(query);
    expect(service.listAll).toHaveBeenCalledWith(query);
    expect(result).toBe(expected);
  });

  // TC-BE-ORDER-CTRL-02: Trả về lỗi khi service throw error (error)
  it('should throw error if service throws', async () => {
    const query: QuerySpecificationDto = { page: 1, limit: 10 } as any;
    service.listAll.mockRejectedValue(new Error('Service error'));
    await expect(controller.list(query)).rejects.toThrow('Service error');
  });

  // TC-BE-ORDER-CTRL-03: Query sai kiểu vẫn truyền vào service (negative)
  it('should pass invalid query values to service without validation', async () => {
    const query = { page: 'abc', limit: 'x' } as any;
    await expect(controller.list(query)).rejects.toThrow(BadRequestException);
    expect(service.listAll).not.toHaveBeenCalled();
  });
});
