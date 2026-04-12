import { Test, TestingModule } from '@nestjs/testing';
import { UserCategoryController } from '../controllers/user-category.controller';
import { UserCategoryService } from './user-category.service';

describe('UserCategoryController', () => {
  let controller: UserCategoryController;
  const mockService: any = { findAll: jest.fn(), findById: jest.fn() };

  beforeEach(() => {
    controller = new UserCategoryController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-USER-CATEGORY-CONTROLLER-001 - getAll forwards to service', async () => {
    // TC-USER-CATEGORY-CONTROLLER-001: getAll forwards to service
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    const query = {} as any;
    mockService.findAll.mockResolvedValue(['a']);
    // Act
    const res = await controller.getAll(query);
    // Assert
    expect(mockService.findAll).toHaveBeenCalledWith(query);
    expect(res).toEqual(['a']);
  });

  it('TC-USER-CATEGORY-CONTROLLER-002 - getOne forwards id to service', async () => {
    // TC-USER-CATEGORY-CONTROLLER-002: getOne forwards id to service
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    mockService.findById.mockResolvedValue({ id: 2 });
    // Act
    const res = await controller.getOne(2);
    // Assert
    expect(mockService.findById).toHaveBeenCalledWith(2);
  });

  it('TC-USER-CATEGORY-CONTROLLER-003 - getAll propagates errors', async () => {
    // TC-USER-CATEGORY-CONTROLLER-003: propagate errors from service.findAll
    mockService.findAll.mockRejectedValue(new Error('fail'));
    await expect(controller.getAll({} as any)).rejects.toThrow('fail');
  });

  it('TC-USER-CATEGORY-CONTROLLER-004 - getOne propagates errors', async () => {
    // TC-USER-CATEGORY-CONTROLLER-004: propagate errors from service.findById
    mockService.findById.mockRejectedValue(new Error('notfound'));
    await expect(controller.getOne(2)).rejects.toThrow('notfound');
  });
});