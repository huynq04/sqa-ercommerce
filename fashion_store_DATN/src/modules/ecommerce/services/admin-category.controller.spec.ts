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

  it('TC-ADMIN-CATEGORY-CONTROLLER-001 - create forwards dto', async () => {
    // TC-ADMIN-CATEGORY-CONTROLLER-001: create forwards dto
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    const dto = { name: 'a' } as any;
    mockService.create.mockResolvedValue({ id: 1 });
    // Act
    const res = await controller.create(dto);
    // Assert
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('TC-ADMIN-CATEGORY-CONTROLLER-002 - delete calls service and returns message', async () => {
    // TC-ADMIN-CATEGORY-CONTROLLER-002: delete calls service and returns message
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    mockService.delete.mockResolvedValue(undefined);
    // Act
    const res = await controller.delete(4);
    // Assert
    expect(mockService.delete).toHaveBeenCalledWith(4);
    expect(res).toEqual({ message: 'Đã xóa danh mục thành công' });
  });

  it('TC-ADMIN-CATEGORY-CONTROLLER-003 - create propagates service errors', async () => {
    // TC-ADMIN-CATEGORY-CONTROLLER-003: create should propagate errors from service
    mockService.create.mockRejectedValue(new Error('create fail'));
    await expect(controller.create({} as any)).rejects.toThrow('create fail');
  });

  it('TC-ADMIN-CATEGORY-CONTROLLER-004 - update forwards dto and returns result', async () => {
    // TC-ADMIN-CATEGORY-CONTROLLER-004: update forwards to service and returns value
    mockService.update.mockResolvedValue({ id: 9 });
    const dto = { id: 9, name: 'x' } as any;
    const res = await controller.update(dto);
    expect(mockService.update).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 9 });
  });
});