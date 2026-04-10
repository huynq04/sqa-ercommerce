import { Test, TestingModule } from '@nestjs/testing';
import { AdminCategoryService } from './admin-category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';

describe('AdminCategoryService', () => {
  let service: AdminCategoryService;
  const mockRepo: any = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCategoryService,
        { provide: getRepositoryToken(Category), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AdminCategoryService>(AdminCategoryService);
  });

  afterEach(() => jest.clearAllMocks());

  it('// TC-admin-category-001: create saves when name unique', async () => {
    // Arrange
    mockRepo.findOne.mockResolvedValue(undefined);
    mockRepo.create.mockReturnValue({ name: 'c' });
    mockRepo.save.mockResolvedValue({ id: 2, name: 'c' });
    // Act
    const res = await service.create({ name: 'c' } as any);
    // Assert
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { name: 'c' } });
    expect(res).toEqual({ id: 2, name: 'c' });
  });

  it('// TC-admin-category-002: create throws when duplicate name', async () => {
    // Arrange
    mockRepo.findOne.mockResolvedValue({ id: 9 });
    // Act & Assert
    await expect(service.create({ name: 'c' } as any)).rejects.toThrow();
  });

  it('// TC-admin-category-003: delete throws when has products', async () => {
    // Arrange
    mockRepo.findOne.mockResolvedValue({ id: 3, products: [1] });
    // Act & Assert
    await expect(service.delete(3)).rejects.toThrow();
  });
});