import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductController } from '../controllers/admin-product.controller';
import { AdminProductService } from './admin-product.service';

describe('AdminProductController', () => {
  let controller: AdminProductController;
  const mockService: any = { create: jest.fn(), update: jest.fn(), delete: jest.fn() };

  beforeEach(async () => {
    controller = new AdminProductController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('// TC-admin-product-controller-001: create forwards dto to service', async () => {
    // Arrange
    const dto = { name: 'a' } as any;
    mockService.create.mockResolvedValue({ id: 1 });
    // Act
    const res = await controller.create(dto);
    // Assert
    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 1 });
  });

  it('// TC-admin-product-controller-002: delete calls service and returns message', async () => {
    // Arrange
    mockService.delete.mockResolvedValue(undefined);
    // Act
    const res = await controller.delete(3);
    // Assert
    expect(mockService.delete).toHaveBeenCalledWith(3);
    expect(res).toEqual({ message: 'Đã xóa sản phẩm thành công' });
  });
});