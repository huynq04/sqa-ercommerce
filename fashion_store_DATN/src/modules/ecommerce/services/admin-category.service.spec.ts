import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminCategoryService } from './admin-category.service';
import { Category } from '../entities/category.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('AdminCategoryService', () => {
  let service: AdminCategoryService;
  // Mock repository để kiểm tra các nhánh nghiệp vụ mà không cần DB thật.
  const mockRepo: any = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

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
    // Arrange: không có category trùng tên nên cho phép tạo mới.
    mockRepo.findOne.mockResolvedValue(undefined);
    mockRepo.create.mockReturnValue({ name: 'new-category' });
    mockRepo.save.mockResolvedValue({ id: 1, name: 'new-category' });

    // Act
    const result = await service.create({ name: 'new-category' } as any);

    // Assert: save phải được gọi và trả đúng entity đã lưu.
    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { name: 'new-category' },
    });
    expect(mockRepo.create).toHaveBeenCalledWith({
      name: 'new-category',
      description: undefined,
      parent: null,
    });
    expect(mockRepo.save).toHaveBeenCalledWith({ name: 'new-category' });
    expect(result).toEqual({ id: 1, name: 'new-category' });
  });

  it('TC-ADMIN-CATEGORY-SERVICE-002 - create throws when duplicate name', async () => {
    // Arrange: đã tồn tại category cùng tên.
    mockRepo.findOne.mockResolvedValue({ id: 9 });

    // Act + Assert: phải chặn tạo trùng bằng ConflictException.
    await expect(service.create({ name: 'dup' } as any)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { name: 'dup' },
    });
    expect(mockRepo.create).not.toHaveBeenCalled();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-CATEGORY-SERVICE-003 - create throws when parent not found', async () => {
    // Arrange
    mockRepo.findOne.mockResolvedValueOnce(undefined);
    mockRepo.findOne.mockResolvedValueOnce(undefined);

    // Act + Assert
    await expect(
      service.create({ name: 'child', parentId: 999 } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mockRepo.findOne).toHaveBeenNthCalledWith(1, {
      where: { name: 'child' },
    });
    expect(mockRepo.findOne).toHaveBeenNthCalledWith(2, {
      where: { id: 999 },
    });
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-CATEGORY-SERVICE-004 - create sets parent when valid parentId provided', async () => {
    // Arrange
    const parent = { id: 2 };
    mockRepo.findOne.mockResolvedValueOnce(undefined);
    mockRepo.findOne.mockResolvedValueOnce(parent);
    mockRepo.create.mockReturnValue({ name: 'child', parent });
    mockRepo.save.mockResolvedValue({ id: 10, name: 'child' });

    // Act
    const result = await service.create({ name: 'child', parentId: 2 } as any);

    // Assert
    expect(mockRepo.create).toHaveBeenCalledWith({
      name: 'child',
      description: undefined,
      parent,
    });
    expect(mockRepo.save).toHaveBeenCalledWith({ name: 'child', parent });
    expect(result).toEqual({ id: 10, name: 'child' });
  });

  it('TC-ADMIN-CATEGORY-SERVICE-005 - create rejects when name missing or empty', async () => {
    // Arrange
    mockRepo.findOne.mockResolvedValue(undefined);

    // Act + Assert
    await expect(service.create({} as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.create({ name: '' } as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('TC-ADMIN-CATEGORY-SERVICE-006 - create rejects when name has wrong type', async () => {
    // Arrange
    mockRepo.findOne.mockResolvedValue(undefined);

    // Act + Assert
    await expect(
      service.create({ name: 123 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-ADMIN-CATEGORY-SERVICE-007 - update throws when category not found', async () => {
    // Arrange: id cần update không tồn tại.
    mockRepo.findOne.mockResolvedValue(undefined);

    // Act + Assert
    await expect(service.update({ id: 99 } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: 99 },
      relations: ['parent', 'children', 'products'],
    });
  });

  it('TC-ADMIN-CATEGORY-SERVICE-008 - update throws when parent not found', async () => {
    // Arrange
    mockRepo.findOne.mockResolvedValueOnce({ id: 1, parent: null });
    mockRepo.findOne.mockResolvedValueOnce(undefined);

    // Act + Assert
    await expect(
      service.update({ id: 1, parentId: 999 } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mockRepo.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: 1 },
      relations: ['parent', 'children', 'products'],
    });
    expect(mockRepo.findOne).toHaveBeenNthCalledWith(2, {
      where: { id: 999 },
    });
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-CATEGORY-SERVICE-009 - update sets parent when valid parentId provided', async () => {
    // Arrange
    const parent = { id: 2 };
    const category = { id: 1, parent: null, name: 'Old' } as any;
    mockRepo.findOne.mockResolvedValueOnce(category);
    mockRepo.findOne.mockResolvedValueOnce(parent);
    mockRepo.save.mockResolvedValue({ id: 1 });

    // Act
    await service.update({ id: 1, parentId: 2 } as any);

    // Assert
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ parent }),
    );
  });

  it('TC-ADMIN-CATEGORY-SERVICE-010 - update merges fields and keeps old values', async () => {
    // Arrange
    const category = {
      id: 1,
      name: 'Old',
      description: 'Old desc',
      parent: null,
    } as any;
    mockRepo.findOne.mockResolvedValue(category);
    mockRepo.save.mockResolvedValue({ id: 1 });

    // Act
    await service.update({ id: 1, name: 'New' } as any);

    // Assert
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New', description: 'Old desc' }),
    );
  });

  it('TC-ADMIN-CATEGORY-SERVICE-011 - update does not overwrite fields with undefined', async () => {
    // Arrange
    const category = {
      id: 1,
      name: 'Old',
      description: 'Old desc',
      parent: null,
    } as any;
    mockRepo.findOne.mockResolvedValue(category);
    mockRepo.save.mockResolvedValue({ id: 1 });

    // Act
    await service.update({ id: 1, name: undefined } as any);

    // Assert
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Old', description: 'Old desc' }),
    );
  });

  it('TC-ADMIN-CATEGORY-SERVICE-012 - update rejects when name has wrong type', async () => {
    // Arrange
    const category = { id: 1, name: 'Old', description: 'Old desc' } as any;
    mockRepo.findOne.mockResolvedValue(category);

    // Act + Assert
    await expect(
      service.update({ id: 1, name: 123 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-ADMIN-CATEGORY-SERVICE-013 - delete throws when category not found', async () => {
    // Arrange
    mockRepo.findOne.mockResolvedValue(undefined);

    // Act + Assert
    await expect(service.delete(4)).rejects.toBeInstanceOf(NotFoundException);
    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: 4 },
      relations: ['products'],
    });
    expect(mockRepo.remove).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-CATEGORY-SERVICE-014 - delete throws when has products', async () => {
    // Arrange: category còn liên kết product nên không được xóa.
    mockRepo.findOne.mockResolvedValue({ id: 4, products: [{ id: 1 }] });

    // Act + Assert
    await expect(service.delete(4)).rejects.toBeInstanceOf(ConflictException);
    expect(mockRepo.remove).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-CATEGORY-SERVICE-015 - delete succeeds when no products', async () => {
    // Arrange: category hợp lệ và không còn product liên quan.
    const category = { id: 4, products: [] };
    mockRepo.findOne.mockResolvedValue(category);
    mockRepo.remove.mockResolvedValue(category);

    // Act
    await service.delete(4);

    // Assert: gọi remove với đúng entity tìm được.
    expect(mockRepo.remove).toHaveBeenCalledWith(category);
  });
});
