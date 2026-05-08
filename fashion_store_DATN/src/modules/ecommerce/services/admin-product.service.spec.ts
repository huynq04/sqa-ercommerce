import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminProductService } from './admin-product.service';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { ProductImage } from '../entities/productImage.entity';
import { ProductVariant } from '../entities/productVariant.entity';
import { OrderItem } from '../entities/orderItem.entity';

describe('AdminProductService', () => {
  let service: AdminProductService;
  const mockProductRepo: any = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const mockCategoryRepo: any = { findOne: jest.fn() };
  const mockImageRepo: any = {
    create: jest.fn((v) => v),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };
  const mockVariantRepo: any = { delete: jest.fn() };
  const mockOrderItemRepo: any = {
    createQueryBuilder: jest.fn(),
  };

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

  const setupOrderItemQb = (count: number) => {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(count),
    };
    mockOrderItemRepo.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  it('TC-ADMIN-PRODUCT-SERVICE-001 - create success returns saved product', async () => {
    // Arrange
    const dto = {
      name: 'Shirt',
      description: 'Cotton',
      price: 100,
      discount: 5,
      stock: 10,
      mainImageUrl: 'main.jpg',
      categoryId: 2,
    } as any;
    const category = { id: 2 };
    const created = { name: 'Shirt' };
    const saved = { id: 10, name: 'Shirt' };
    const createdImage = {
      product: { id: 10 },
      imageUrl: 'main.jpg',
      isMain: true,
    };
    mockCategoryRepo.findOne.mockResolvedValue(category);
    mockProductRepo.create.mockReturnValue(created);
    mockProductRepo.save.mockResolvedValue(saved);
    mockImageRepo.create.mockReturnValue(createdImage);
    mockImageRepo.save.mockResolvedValue({ id: 99 });

    // Act
    const result = await service.create(dto);

    // Assert
    expect(result).toEqual(saved);
    expect(mockCategoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
    expect(mockProductRepo.create).toHaveBeenCalledWith({
      name: 'Shirt',
      description: 'Cotton',
      price: 100,
      discount: 5,
      stock: 10,
      mainImageUrl: 'main.jpg',
      category,
    });
    expect(mockProductRepo.save).toHaveBeenCalledWith(created);
    expect(mockImageRepo.create).toHaveBeenCalledWith(createdImage);
    expect(mockImageRepo.save).toHaveBeenCalledWith(createdImage);
  });

  it('TC-ADMIN-PRODUCT-SERVICE-002 - create throws NotFoundException when category missing', async () => {
    // Arrange
    mockCategoryRepo.findOne.mockResolvedValue(undefined);

    // Act + Assert
    await expect(
      service.create({ name: 'A', categoryId: 999 } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mockCategoryRepo.findOne).toHaveBeenCalledWith({
      where: { id: 999 },
    });
    expect(mockProductRepo.create).not.toHaveBeenCalled();
    expect(mockProductRepo.save).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-003 - create applies default values when optional fields missing', async () => {
    // Arrange
    const dto = {
      name: 'A',
      description: 'desc',
      price: 100,
      categoryId: 2,
    } as any;
    const category = { id: 2 };
    const created = { name: 'A' };
    const saved = { id: 11, name: 'A' };
    mockCategoryRepo.findOne.mockResolvedValue(category);
    mockProductRepo.create.mockReturnValue(created);
    mockProductRepo.save.mockResolvedValue(saved);

    // Act
    await service.create(dto);

    // Assert
    expect(mockProductRepo.create).toHaveBeenCalledWith({
      name: 'A',
      description: 'desc',
      price: 100,
      discount: 0,
      stock: 0,
      mainImageUrl: null,
      category,
    });
    expect(mockImageRepo.save).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-004 - create saves image when mainImageUrl provided', async () => {
    // Arrange
    mockCategoryRepo.findOne.mockResolvedValue({ id: 2 });
    mockProductRepo.create.mockReturnValue({ name: 'A' });
    mockProductRepo.save.mockResolvedValue({ id: 10, name: 'A' });
    mockImageRepo.create.mockReturnValue({
      product: { id: 10 },
      imageUrl: 'img.jpg',
      isMain: true,
    });

    // Act
    await service.create({
      name: 'A',
      categoryId: 2,
      mainImageUrl: 'img.jpg',
    } as any);

    // Assert
    expect(mockImageRepo.create).toHaveBeenCalledWith({
      product: { id: 10 },
      imageUrl: 'img.jpg',
      isMain: true,
    });
    expect(mockImageRepo.save).toHaveBeenCalledWith({
      product: { id: 10 },
      imageUrl: 'img.jpg',
      isMain: true,
    });
  });

  it('TC-ADMIN-PRODUCT-SERVICE-005 - create skips image when mainImageUrl missing or null', async () => {
    // Arrange
    mockCategoryRepo.findOne.mockResolvedValue({ id: 2 });
    mockProductRepo.create.mockReturnValue({ name: 'A' });
    mockProductRepo.save.mockResolvedValue({ id: 11, name: 'A' });

    // Act
    await service.create({ name: 'A', categoryId: 2 } as any);
    await service.create({ name: 'B', categoryId: 2, mainImageUrl: null } as any);

    // Assert
    expect(mockImageRepo.save).not.toHaveBeenCalled();
    expect(mockImageRepo.create).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-006 - create rejects when name missing or empty', async () => {
    // Arrange
    mockCategoryRepo.findOne.mockResolvedValue({ id: 1 });

    // Act + Assert
    await expect(
      service.create({ price: 100, categoryId: 1 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create({ name: '', price: 100, categoryId: 1 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-ADMIN-PRODUCT-SERVICE-007 - create rejects when price invalid (null/undefined/negative)', async () => {
    // Arrange
    mockCategoryRepo.findOne.mockResolvedValue({ id: 1 });

    // Act + Assert
    await expect(
      service.create({ name: 'A', price: null, categoryId: 1 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create({ name: 'A', price: undefined, categoryId: 1 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create({ name: 'A', price: -10, categoryId: 1 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-ADMIN-PRODUCT-SERVICE-008 - create rejects when categoryId missing or wrong type', async () => {
    // Arrange
    mockCategoryRepo.findOne.mockResolvedValue({ id: 1 });

    // Act + Assert
    await expect(
      service.create({ name: 'A', price: 100 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create({ name: 'A', price: 100, categoryId: 'x' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-ADMIN-PRODUCT-SERVICE-009 - update throws NotFoundException when product missing', async () => {
    // Arrange
    mockProductRepo.findOne.mockResolvedValue(undefined);

    // Act + Assert
    await expect(service.update({ id: 999 } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(mockProductRepo.findOne).toHaveBeenCalledWith({
      where: { id: 999 },
      relations: ['category'],
    });
  });

  it('TC-ADMIN-PRODUCT-SERVICE-010 - update throws NotFoundException when category missing', async () => {
    // Arrange
    mockProductRepo.findOne.mockResolvedValue({
      id: 8,
      mainImageUrl: 'old.jpg',
      category: { id: 1 },
    });
    mockCategoryRepo.findOne.mockResolvedValue(undefined);

    // Act + Assert
    await expect(
      service.update({ id: 8, categoryId: 999 } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mockCategoryRepo.findOne).toHaveBeenCalledWith({
      where: { id: 999 },
    });
    expect(mockProductRepo.save).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-011 - update changes category when valid categoryId provided', async () => {
    // Arrange
    const product = {
      id: 8,
      mainImageUrl: 'old.jpg',
      category: { id: 1 },
    };
    const newCategory = { id: 2 };
    mockProductRepo.findOne.mockResolvedValue(product);
    mockCategoryRepo.findOne.mockResolvedValue(newCategory);
    mockProductRepo.save.mockResolvedValue({ id: 8 });

    // Act
    await service.update({ id: 8, categoryId: 2 } as any);

    // Assert
    expect(mockCategoryRepo.findOne).toHaveBeenCalledWith({
      where: { id: 2 },
    });
    expect(mockProductRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ category: newCategory }),
    );
  });

  it('TC-ADMIN-PRODUCT-SERVICE-012 - update replaces main image when changed', async () => {
    // Arrange
    const product = {
      id: 8,
      mainImageUrl: 'old.jpg',
      category: { id: 1 },
    };
    const createdImage = {
      product: { id: 8 },
      imageUrl: 'new.jpg',
      isMain: true,
    };
    mockProductRepo.findOne.mockResolvedValue(product);
    mockProductRepo.save.mockResolvedValue({ id: 8, mainImageUrl: 'new.jpg' });
    mockImageRepo.create.mockReturnValue(createdImage);

    // Act
    await service.update({ id: 8, mainImageUrl: 'new.jpg' } as any);

    // Assert
    expect(mockImageRepo.update).toHaveBeenCalledWith(
      { product: { id: 8 }, isMain: true },
      { isMain: false },
    );
    expect(mockImageRepo.create).toHaveBeenCalledWith(createdImage);
    expect(mockImageRepo.save).toHaveBeenCalledWith(createdImage);
  });

  it('TC-ADMIN-PRODUCT-SERVICE-013 - update skips image update when url unchanged', async () => {
    // Arrange
    mockProductRepo.findOne.mockResolvedValue({
      id: 9,
      mainImageUrl: 'same.jpg',
      category: { id: 1 },
      name: 'Old',
      description: 'Old',
      price: 100,
      discount: 0,
      stock: 5,
    });
    mockProductRepo.save.mockResolvedValue({ id: 9 });

    // Act
    await service.update({ id: 9, mainImageUrl: 'same.jpg' } as any);

    // Assert
    expect(mockImageRepo.update).not.toHaveBeenCalled();
    expect(mockImageRepo.save).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-014 - update merges fields and keeps old values for partial update', async () => {
    // Arrange
    const existing = {
      id: 10,
      name: 'Old',
      description: 'Old desc',
      price: 100,
      discount: 5,
      stock: 2,
      mainImageUrl: 'old.jpg',
      category: { id: 1 },
    };
    mockProductRepo.findOne.mockResolvedValue(existing);
    mockProductRepo.save.mockResolvedValue({ id: 10 });

    // Act
    await service.update({ id: 10, name: 'New', stock: 9 } as any);

    // Assert
    expect(mockProductRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New',
        stock: 9,
        description: 'Old desc',
        price: 100,
        discount: 5,
        mainImageUrl: 'old.jpg',
      }),
    );
  });

  it('TC-ADMIN-PRODUCT-SERVICE-015 - update does not overwrite fields with undefined', async () => {
    // Arrange
    const existing = {
      id: 12,
      name: 'Old',
      description: 'Old desc',
      price: 100,
      discount: 5,
      stock: 2,
      mainImageUrl: 'old.jpg',
      category: { id: 1 },
    };
    mockProductRepo.findOne.mockResolvedValue(existing);
    mockProductRepo.save.mockResolvedValue({ id: 12 });

    // Act
    await service.update({ id: 12, name: undefined, price: undefined } as any);

    // Assert
    expect(mockProductRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Old',
        price: 100,
      }),
    );
  });

  it('TC-ADMIN-PRODUCT-SERVICE-016 - update rejects invalid fields (price/discount/stock/type)', async () => {
    // Arrange
    mockProductRepo.findOne.mockResolvedValue({
      id: 20,
      name: 'Old',
      description: 'Old desc',
      price: 100,
      discount: 5,
      stock: 2,
      mainImageUrl: 'old.jpg',
      category: { id: 1 },
    });

    // Act + Assert
    await expect(
      service.update({ id: 20, price: -1 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.update({ id: 20, discount: 200 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.update({ id: 20, stock: -10 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.update({ id: 20, mainImageUrl: 123 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-ADMIN-PRODUCT-SERVICE-017 - delete throws BadRequest when usedInOrders > 0', async () => {
    // Arrange
    const qb = setupOrderItemQb(2);

    // Act + Assert
    await expect(service.delete(5)).rejects.toBeInstanceOf(BadRequestException);
    expect(mockOrderItemRepo.createQueryBuilder).toHaveBeenCalledWith(
      'orderItem',
    );
    expect(qb.innerJoin).toHaveBeenCalledWith('orderItem.variant', 'variant');
    expect(qb.where).toHaveBeenCalledWith('variant.product_id = :id', { id: 5 });
    expect(qb.getCount).toHaveBeenCalledWith();
    expect(mockImageRepo.delete).not.toHaveBeenCalled();
    expect(mockVariantRepo.delete).not.toHaveBeenCalled();
    expect(mockProductRepo.remove).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-018 - delete throws NotFoundException when product missing', async () => {
    // Arrange
    setupOrderItemQb(0);
    mockProductRepo.findOne.mockResolvedValue(undefined);

    // Act + Assert
    await expect(service.delete(5)).rejects.toBeInstanceOf(NotFoundException);
    expect(mockImageRepo.delete).toHaveBeenCalledWith({ product: { id: 5 } });
    expect(mockVariantRepo.delete).toHaveBeenCalledWith({ product: { id: 5 } });
    expect(mockProductRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(mockProductRepo.remove).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-PRODUCT-SERVICE-019 - delete succeeds and performs cleanup in order', async () => {
    // Arrange
    setupOrderItemQb(0);
    const product = { id: 5 };
    mockProductRepo.findOne.mockResolvedValue(product);
    mockProductRepo.remove.mockResolvedValue(product);

    // Act
    await service.delete(5);

    // Assert
    expect(mockImageRepo.delete).toHaveBeenCalledWith({ product: { id: 5 } });
    expect(mockVariantRepo.delete).toHaveBeenCalledWith({ product: { id: 5 } });
    expect(mockProductRepo.remove).toHaveBeenCalledWith(product);
    const deleteImageOrder = mockImageRepo.delete.mock.invocationCallOrder[0];
    const deleteVariantOrder = mockVariantRepo.delete.mock.invocationCallOrder[0];
    const removeProductOrder = mockProductRepo.remove.mock.invocationCallOrder[0];
    expect(deleteImageOrder).toBeLessThan(deleteVariantOrder);
    expect(deleteVariantOrder).toBeLessThan(removeProductOrder);
  });
});
