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

  it('TC-admin-product-controller-001 - create forwards dto to service', async () => {
    // TC-admin-product-controller-001: create forwards dto to service
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
    expect(res).toEqual({ id: 1 });
  });

  it('TC-admin-product-controller-002 - delete calls service and returns message', async () => {
    // TC-admin-product-controller-002: delete calls service and returns message
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    mockService.delete.mockResolvedValue(undefined);
    // Act
    const res = await controller.delete(3);
    // Assert
    expect(mockService.delete).toHaveBeenCalledWith(3);
    expect(res).toEqual({ message: 'Đã xóa sản phẩm thành công' });
  });

  it('TC-admin-product-controller-003 - update forwards dto to service', async () => {
    // TC-admin-product-controller-003: update forwards to service
    const dto = { id: 7, name: 'updated' } as any;
    mockService.update.mockResolvedValue({ id: 7, name: 'updated' });

    const res = await controller.update(dto);

    expect(mockService.update).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 7, name: 'updated' });
  });

  it('TC-admin-product-controller-004 - update propagates service errors', async () => {
    // TC-admin-product-controller-004: update should propagate errors from service
    mockService.update.mockRejectedValue(new Error('update fail'));
    await expect(controller.update({ id: 8, name: 'x' } as any)).rejects.toThrow('update fail');
  });

  // TC-admin-product-controller-005: create propagates service errors
  it('TC-admin-product-controller-005 - create propagates service errors', async () => {
    // Arrange: mock create failure
    // CheckDB: mocked - no DB touch
    // Act: call create
    // Assert: error is propagated
    // Rollback: mocked - nothing to rollback
    mockService.create.mockRejectedValue(new Error('create fail'));

    await expect(controller.create({ name: 'bad' } as any)).rejects.toThrow('create fail');
  });

  // TC-admin-product-controller-006: delete propagates service errors
  it('TC-admin-product-controller-006 - delete propagates service errors', async () => {
    // Arrange: mock delete failure
    // CheckDB: mocked - no DB touch
    // Act: call delete
    // Assert: error is propagated
    // Rollback: mocked - nothing to rollback
    mockService.delete.mockRejectedValue(new Error('delete fail'));

    await expect(controller.delete(99)).rejects.toThrow('delete fail');
  });
});
