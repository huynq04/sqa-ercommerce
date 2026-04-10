




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
  const mockImageRepo: any = { save: jest.fn(), delete: jest.fn(), update: jest.fn() };
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

  it('// TC-admin-product-001: create succeeds when category exists', async () => {
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

  it('// TC-admin-product-002: create throws NotFoundException when category missing', async () => {
    // Arrange
    mockCategoryRepo.findOne.mockResolvedValue(undefined);
    // Act & Assert
    await expect(service.create({ name: 'x', categoryId: 99 } as any)).rejects.toThrow();
  });

  it('// TC-admin-product-003: delete throws BadRequest when usedInOrders > 0', async () => {
    // Arrange
    mockOrderItemRepo.createQueryBuilder().getCount.mockResolvedValue(2);
    // Act & Assert
    await expect(service.delete(5)).rejects.toThrow();
  });
});