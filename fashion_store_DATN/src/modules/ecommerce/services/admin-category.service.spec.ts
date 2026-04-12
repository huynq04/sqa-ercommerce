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

  it('TC-ADMIN-CATEGORY-SERVICE-001 - create saves when name unique', async () => {
    // TC-ADMIN-CATEGORY-SERVICE-001: create saves when name unique
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
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

  it('TC-ADMIN-CATEGORY-SERVICE-002 - create throws when duplicate name', async () => {
    // TC-ADMIN-CATEGORY-SERVICE-002: create throws when duplicate name
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    mockRepo.findOne.mockResolvedValue({ id: 9 });
    // Act & Assert
    await expect(service.create({ name: 'c' } as any)).rejects.toThrow();
  });

  it('TC-ADMIN-CATEGORY-SERVICE-003 - delete throws when has products', async () => {
    // TC-ADMIN-CATEGORY-SERVICE-003: delete throws when has products
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    mockRepo.findOne.mockResolvedValue({ id: 3, products: [1] });
    // Act & Assert
    await expect(service.delete(3)).rejects.toThrow();
  });

  it('TC-ADMIN-CATEGORY-SERVICE-004 - delete succeeds when no products', async () => {
    // TC-ADMIN-CATEGORY-SERVICE-004: delete succeeds when no products in category
    // Arrange: setup mock category without products
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify remove is called and function resolves void
    // Rollback: mocked - nothing to rollback
    mockRepo.findOne.mockResolvedValue({ id: 4, products: [] });
    mockRepo.remove.mockResolvedValue({ id: 4 });

    const res = await service.delete(4);
    expect(mockRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 4 } }));
    expect(mockRepo.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }));
    expect(res).toBeUndefined();
  });

  it('TC-ADMIN-CATEGORY-SERVICE-005 - create propagates save errors', async () => {
    // TC-ADMIN-CATEGORY-SERVICE-005: create should propagate errors from save
    mockRepo.findOne.mockResolvedValue(undefined);
    mockRepo.create.mockReturnValue({ name: 'z' });
    mockRepo.save.mockRejectedValue(new Error('save fail'));

    await expect(service.create({ name: 'z' } as any)).rejects.toThrow('save fail');
  });

  it('TC-ADMIN-CATEGORY-SERVICE-006 - update throws when category not found', async () => {
    // TC-ADMIN-CATEGORY-SERVICE-006: update throws when category to update not found
    mockRepo.findOne.mockResolvedValue(undefined);
    await expect(service.update({ id: 99 } as any)).rejects.toThrow();
  });

  it('TC-ADMIN-CATEGORY-SERVICE-007 - update throws when parent not found', async () => {
    // TC-ADMIN-CATEGORY-SERVICE-007: update should throw when parentId provided but parent missing
    const existing = { id: 10, name: 'abc', parent: null } as any;
    mockRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(undefined);
    await expect(service.update({ id: 10, parentId: 999 } as any)).rejects.toThrow();
  });

  it('TC-ADMIN-CATEGORY-SERVICE-008 - update propagates save errors', async () => {
    // TC-ADMIN-CATEGORY-SERVICE-008: update should propagate repository save errors
    const existing = { id: 12, name: 'a', parent: null } as any;
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.save.mockRejectedValue(new Error('save fail'));
    await expect(service.update({ id: 12, name: 'new' } as any)).rejects.toThrow('save fail');
  });

  it('TC-ADMIN-CATEGORY-SERVICE-009 - create resolves parent when parentId provided', async () => {
    // TC-ADMIN-CATEGORY-SERVICE-009: create sets parent when parentId exists
    // Arrange: mock unique name and existing parent category
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify parent passed into create payload
    // Rollback: mocked - nothing to rollback
    const parent = { id: 7 } as any;
    mockRepo.findOne
      .mockResolvedValueOnce(undefined) // check duplicate name
      .mockResolvedValueOnce(parent); // find parent by id
    mockRepo.create.mockImplementation((payload: any) => payload);
    mockRepo.save.mockImplementation(async (payload: any) => ({ id: 8, ...payload }));

    const res = await service.create({ name: 'child', parentId: 7 } as any);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'child',
        parent,
      }),
    );
    expect(res).toEqual(expect.objectContaining({ id: 8, parent }));
  });

  it('TC-ADMIN-CATEGORY-SERVICE-010 - update saves changed fields and parent', async () => {
    // TC-ADMIN-CATEGORY-SERVICE-010: update merges dto and saves entity
    // Arrange: mock existing category and new parent category
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify save called with merged name/description/parent
    // Rollback: mocked - nothing to rollback
    const existing = { id: 20, name: 'old', description: 'old-d', parent: null } as any;
    const newParent = { id: 21 } as any;
    mockRepo.findOne
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(newParent);
    mockRepo.save.mockImplementation(async (payload: any) => payload);

    const res = await service.update({
      id: 20,
      name: 'new',
      description: 'new-d',
      parentId: 21,
    } as any);

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 20,
        name: 'new',
        description: 'new-d',
        parent: newParent,
      }),
    );
    expect(res).toEqual(
      expect.objectContaining({
        id: 20,
        name: 'new',
        description: 'new-d',
        parent: newParent,
      }),
    );
  });
});
