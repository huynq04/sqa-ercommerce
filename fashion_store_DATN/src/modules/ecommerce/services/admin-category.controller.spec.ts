import { Test, TestingModule } from '@nestjs/testing';
import { AdminCategoryController } from '../controllers/admin-category.controller';
import { AdminCategoryService } from './admin-category.service';

describe('AdminCategoryController', () => {
  let controller: AdminCategoryController;
  const mockService: any = { create: jest.fn(), update: jest.fn(), delete: jest.fn() };

  beforeEach(async () => {
    controller = new AdminCategoryController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('// TC-admin-category-controller-001: create forwards dto', async () => {
    // Arrange
    const dto = { name: 'a' } as any;
    mockService.create.mockResolvedValue({ id: 1 });
    // Act
    const res = await controller.create(dto);
    // Assert
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('// TC-admin-category-controller-002: delete calls service and returns message', async () => {
    // Arrange
    mockService.delete.mockResolvedValue(undefined);
    // Act
    const res = await controller.delete(4);
    // Assert
    expect(mockService.delete).toHaveBeenCalledWith(4);
    expect(res).toEqual({ message: 'Đã xóa danh mục thành công' });
  });
});