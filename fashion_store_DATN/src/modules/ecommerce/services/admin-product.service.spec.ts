




import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductService } from './admin-product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { ProductImage } from '../entities/productImage.entity';
import { ProductVariant } from '../entities/productVariant.entity';
import { OrderItem } from '../entities/orderItem.entity';

describe('AdminProductService', () => {
  let service: AdminProductService;
  const mockProductRepo: any = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), remove: jest.fn() };
  const mockCategoryRepo: any = { findOne: jest.fn() };
  const mockImageRepo: any = { create: jest.fn((d)=>d), save: jest.fn(), delete: jest.fn(), update: jest.fn() };
  const mockVariantRepo: any = { delete: jest.fn() };
  const mockOrderItemRepo: any = { createQueryBuilder: jest.fn(() => ({ innerJoin: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(0) })) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProductService,
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(ProductImage), useValue: mockImageRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: mockVariantRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },
      ],
    }).compile();

    service = module.get<AdminProductService>(AdminProductService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-ADMIN-PRODUCT-SERVICE-001 - create succeeds when category exists', async () => {
    // TC-ADMIN-PRODUCT-SERVICE-001: create succeeds when category exists
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    const dto: any = { name: 'x', categoryId: 9 };
    mockCategoryRepo.findOne.mockResolvedValue({ id: 9 });
    mockProductRepo.create.mockReturnValue({ name: 'x' });
    mockProductRepo.save.mockResolvedValue({ id: 12, name: 'x' });
    // Act
    const res = await service.create(dto);
    // Assert
    expect(mockCategoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 9 } });
    expect(mockProductRepo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 12, name: 'x' });
  });

  it('TC-ADMIN-PRODUCT-SERVICE-002 - create throws NotFoundException when category missing', async () => {
    // TC-ADMIN-PRODUCT-SERVICE-002: create throws NotFoundException when category missing
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    mockCategoryRepo.findOne.mockResolvedValue(undefined);
    // Act & Assert
    await expect(service.create({ name: 'x', categoryId: 99 } as any)).rejects.toThrow();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-003 - delete throws BadRequest when usedInOrders > 0', async () => {
    // TC-ADMIN-PRODUCT-SERVICE-003: delete throws BadRequest when usedInOrders > 0
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    mockOrderItemRepo.createQueryBuilder().getCount.mockResolvedValue(2);
    // Act & Assert
    await expect(service.delete(5)).rejects.toThrow();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-004 - delete succeeds when usedInOrders is 0', async () => {
    // TC-ADMIN-PRODUCT-SERVICE-004: delete succeeds when usedInOrders is 0
    // Arrange: mock repository and query builder to indicate zero usage
    // CheckDB: mocked - no DB touch
    // Act: call delete
    // Assert: verify repository remove called and returns success
    // Rollback: mocked - nothing to rollback
    const qb: any = { innerJoin: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(0) };
    mockOrderItemRepo.createQueryBuilder.mockReturnValue(qb);
    mockProductRepo.findOne.mockResolvedValue({ id: 5 });
    mockProductRepo.remove.mockResolvedValue({ id: 5 });

    const res = await service.delete(5);

    expect(qb.getCount).toHaveBeenCalled();
    expect(mockProductRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(mockProductRepo.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }));
    expect(res).toBeUndefined();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-005 - create saves image when mainImageUrl provided', async () => {
    // TC-ADMIN-PRODUCT-SERVICE-005: create persists mainImage and calls productImageRepo.save
    const dto: any = { name: 'img', categoryId: 2, mainImageUrl: 'http://img' };
    mockCategoryRepo.findOne.mockResolvedValue({ id: 2 });
    mockProductRepo.create.mockReturnValue({ name: 'img' });
    mockProductRepo.save.mockResolvedValue({ id: 20, name: 'img' });
    mockImageRepo.save.mockResolvedValue({ id: 100 });

    const res = await service.create(dto);

    expect(mockProductRepo.save).toHaveBeenCalled();
    expect(mockImageRepo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 20, name: 'img' });
  });

  it('TC-ADMIN-PRODUCT-SERVICE-006 - update throws NotFoundException when product missing', async () => {
    // TC-ADMIN-PRODUCT-SERVICE-006: update throws when product not found
    mockProductRepo.findOne.mockResolvedValue(undefined);
    await expect(service.update({ id: 99 } as any)).rejects.toThrow();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-007 - update throws when new category not found', async () => {
    // TC-ADMIN-PRODUCT-SERVICE-007: update throws when categoryId provided but not found
    const existing = { id: 11, mainImageUrl: 'old.jpg', category: { id: 1 } } as any;
    mockProductRepo.findOne.mockResolvedValue(existing);
    mockCategoryRepo.findOne.mockResolvedValue(undefined);
    await expect(service.update({ id: 11, categoryId: 999 } as any)).rejects.toThrow();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-008 - update replaces main image when changed', async () => {
    // TC-ADMIN-PRODUCT-SERVICE-008: update should call imageRepo.update and save when mainImageUrl changed
    const existing = { id: 13, mainImageUrl: 'old.jpg', category: { id: 1 } } as any;
    mockProductRepo.findOne.mockResolvedValue(existing);
    mockCategoryRepo.findOne.mockResolvedValue({ id: 1 });
    mockImageRepo.update.mockResolvedValue({});
    mockImageRepo.save.mockResolvedValue({ id: 55 });
    mockProductRepo.save.mockResolvedValue({ id: 13, mainImageUrl: 'new.jpg' });

    const res = await service.update({ id: 13, mainImageUrl: 'new.jpg' } as any);

    expect(mockImageRepo.update).toHaveBeenCalled();
    expect(mockImageRepo.save).toHaveBeenCalled();
    expect(mockProductRepo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 13, mainImageUrl: 'new.jpg' });
  });

  it('TC-ADMIN-PRODUCT-SERVICE-009 - delete throws NotFoundException when product missing after checks', async () => {
    // TC-ADMIN-PRODUCT-SERVICE-009: delete throws when product not found
    mockOrderItemRepo.createQueryBuilder().getCount.mockResolvedValue(0);
    mockProductRepo.findOne.mockResolvedValue(undefined);
    await expect(service.delete(999)).rejects.toThrow();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-010 - create propagates save errors', async () => {
    // TC-ADMIN-PRODUCT-SERVICE-010: create should propagate repository save errors
    const dto: any = { name: 'x', categoryId: 9 };
    mockCategoryRepo.findOne.mockResolvedValue({ id: 9 });
    mockProductRepo.create.mockReturnValue({ name: 'x' });
    mockProductRepo.save.mockRejectedValue(new Error('save fail'));
    await expect(service.create(dto)).rejects.toThrow('save fail');
  });
});