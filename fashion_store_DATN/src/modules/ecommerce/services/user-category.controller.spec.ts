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

  it('// TC-user-category-controller-001: getAll forwards to service', async () => {
    // Arrange
    const query = {} as any;
    mockService.findAll.mockResolvedValue(['a']);
    // Act
    const res = await controller.getAll(query);
    // Assert
    expect(mockService.findAll).toHaveBeenCalledWith(query);
    expect(res).toEqual(['a']);
  });

  it('// TC-user-category-controller-002: getOne forwards id to service', async () => {
    // Arrange
    mockService.findById.mockResolvedValue({ id: 2 });
    // Act
    const res = await controller.getOne(2);
    // Assert
    expect(mockService.findById).toHaveBeenCalledWith(2);
  });
});