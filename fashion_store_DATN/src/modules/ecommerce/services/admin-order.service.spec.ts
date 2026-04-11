// admin-order.service.spec.ts
// Unit tests for AdminOrderService
// Sử dụng Jest và @nestjs/testing

import { Test, TestingModule } from '@nestjs/testing';
import { AdminOrderService } from './admin-order.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '@modules/ecommerce/entities/order.entity';
import { Repository } from 'typeorm';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';

// Mock BaseService để kiểm tra gọi hàm listPaginate
class MockBaseService {
  listPaginate = jest.fn();
}

describe('AdminOrderService', () => {
  let service: AdminOrderService;

  beforeEach(() => {
    service = new AdminOrderService({} as any);
    // Gán mock cho listPaginate
    service.listPaginate = jest.fn();
  });

  // TC-BE-ORDER-01: Trả về danh sách order đúng với query hợp lệ (success)
  it('should return paginated orders with correct relations', async () => {
    const query: QuerySpecificationDto = { page: 1, limit: 10 } as any;
    const expectedResult = { data: [{ id: 1 }], total: 1 };
    (service.listPaginate as jest.Mock).mockResolvedValue(expectedResult);

    const result = await service.listAll(query);
    expect(service.listPaginate).toHaveBeenCalledWith(query, {
      relations: ['user', 'items', 'items.variant', 'items.variant.product'],
      order: { createdAt: 'DESC' },
    });
    expect(result).toBe(expectedResult);
  });

  // TC-BE-ORDER-02: Trả về danh sách rỗng khi không có order (edge)
  it('should return empty result if no orders found', async () => {
    const query: QuerySpecificationDto = { page: 1, limit: 10 } as any;
    const expectedResult = { data: [], total: 0 };
    (service.listPaginate as jest.Mock).mockResolvedValue(expectedResult);
    const result = await service.listAll(query);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  // TC-BE-ORDER-03: Xử lý lỗi khi repo gặp exception (error)
  it('should throw error if listPaginate throws', async () => {
    const query: QuerySpecificationDto = { page: 1, limit: 10 } as any;
    (service.listPaginate as jest.Mock).mockRejectedValue(new Error('DB error'));
    await expect(service.listAll(query)).rejects.toThrow('DB error');
  });
});
