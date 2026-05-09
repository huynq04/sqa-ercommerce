import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { ProductSize } from '@modules/ecommerce/entities/productSize.entity';
import { ProductColor } from '@modules/ecommerce/entities/productColor.entity';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import {
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from '@modules/ecommerce/dtos/product.dto';
import { AdminProductVariantService } from './admin-product-variant.service';

describe('AdminProductVariantService', () => {
  let service: AdminProductVariantService;
  let variantRepo: jest.Mocked<Repository<ProductVariant>>;
  let productRepo: jest.Mocked<Repository<Product>>;
  let sizeRepo: jest.Mocked<Repository<ProductSize>>;
  let colorRepo: jest.Mocked<Repository<ProductColor>>;
  let orderItemRepo: jest.Mocked<Repository<OrderItem>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProductVariantService,
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductSize),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductColor),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdminProductVariantService);
    variantRepo = module.get(getRepositoryToken(ProductVariant));
    productRepo = module.get(getRepositoryToken(Product));
    sizeRepo = module.get(getRepositoryToken(ProductSize));
    colorRepo = module.get(getRepositoryToken(ProductColor));
    orderItemRepo = module.get(getRepositoryToken(OrderItem));

    const qb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
    };
    variantRepo.createQueryBuilder.mockReturnValue(qb as any);

    jest.clearAllMocks();
  });

  // TC-ADMIN-PRODUCT-VARIANT-SERVICE-01: Bao loi khi san pham khong ton tai
  it('should throw NotFoundException when product is missing', async () => {
    // Arrange
    const createDto: CreateProductVariantDto = {
      productId: 1,
      sku: 'A',
      price: 1,
      stock: 1,
    };
    productRepo.findOne.mockResolvedValue(null);

    // Act + Assert
    await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  // TC-ADMIN-PRODUCT-VARIANT-SERVICE-02: Bao loi khi bien the bi trung
  it('should throw BadRequestException when duplicate variant exists', async () => {
    // Arrange
    const createDto: CreateProductVariantDto = {
      productId: 1,
      sizeId: 2,
      colorId: 3,
      sku: 'A',
      price: 100,
      stock: 10,
    };
    productRepo.findOne.mockResolvedValue({ id: 1 } as Product);
    variantRepo.findOne.mockResolvedValue({ id: 10 } as ProductVariant);

    // Act + Assert
    await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    expect(variantRepo.findOne).toHaveBeenCalled();
  });

  // TC-ADMIN-PRODUCT-VARIANT-SERVICE-03: Tao bien the va dong bo ton kho
  it('should create variant and sync product stock', async () => {
    // Arrange
    const product = { id: 1 } as Product;
    const size = { id: 2 } as ProductSize;
    const color = { id: 3 } as ProductColor;
    const variant = { id: 11, product, size, color, stock: 5 } as ProductVariant;

    productRepo.findOne.mockResolvedValue(product);
    variantRepo.findOne.mockResolvedValue(null);
    sizeRepo.findOneBy.mockResolvedValue(size);
    colorRepo.findOneBy.mockResolvedValue(color);
    variantRepo.create.mockReturnValue(variant);
    variantRepo.save.mockResolvedValue(variant);
    productRepo.update.mockResolvedValue({} as any);

    // Act
    const createDto: CreateProductVariantDto = {
      productId: 1,
      sizeId: 2,
      colorId: 3,
      sku: 'SKU-1',
      price: 100,
      stock: 5,
      imageUrl: 'v.jpg',
    };
    const result = await service.create(createDto);

    // Assert
    expect(variantRepo.save).toHaveBeenCalledWith(variant);
    expect(productRepo.update).toHaveBeenCalledWith({ id: 1 }, { stock: 0 });
    expect(result).toBe(variant);
  });

  // TC-ADMIN-PRODUCT-VARIANT-SERVICE-04: Bao loi khi bien the khong ton tai
  it('should throw NotFoundException when variant is missing', async () => {
    // Arrange
    const updateDto: UpdateProductVariantDto = { id: 99, sku: 'X' };
    variantRepo.findOne.mockResolvedValue(null);

    // Act + Assert
    await expect(service.update(updateDto)).rejects.toThrow(NotFoundException);
    expect(variantRepo.findOne).toHaveBeenCalled();
  });

  // TC-ADMIN-PRODUCT-VARIANT-SERVICE-05: Bao loi khi to hop size/mau bi trung
  it('should throw BadRequestException for duplicate combination', async () => {
    // Arrange
    const variant = {
      id: 1,
      product: { id: 1 },
      size: { id: 1 },
      color: { id: 1 },
      sku: 'A',
      price: 10,
      stock: 2,
      imageUrl: 'a.jpg',
    } as ProductVariant;
    variantRepo.findOne
      .mockResolvedValueOnce(variant)
      .mockResolvedValueOnce({ id: 2 } as ProductVariant);

    // Act + Assert
    const updateDto: UpdateProductVariantDto = {
      id: 1,
      productId: 1,
      sizeId: 1,
      colorId: 1,
    };
    await expect(service.update(updateDto)).rejects.toThrow(BadRequestException);
    expect(variantRepo.findOne).toHaveBeenCalledTimes(2);
  });

  // TC-ADMIN-PRODUCT-VARIANT-SERVICE-06: Bao loi khi san pham moi khong ton tai
  it('should throw NotFoundException when new product does not exist', async () => {
    // Arrange
    const variant = {
      id: 1,
      product: { id: 1 },
      size: { id: 1 },
      color: { id: 1 },
      sku: 'A',
      price: 10,
      stock: 2,
      imageUrl: 'a.jpg',
    } as ProductVariant;
    variantRepo.findOne
      .mockResolvedValueOnce(variant)
      .mockResolvedValueOnce(null);
    productRepo.findOneBy.mockResolvedValue(null);

    // Act + Assert
    const updateDto: UpdateProductVariantDto = { id: 1, productId: 2 };
    await expect(service.update(updateDto)).rejects.toThrow(NotFoundException);
    expect(productRepo.findOneBy).toHaveBeenCalledWith({ id: 2 });
  });

  // TC-ADMIN-PRODUCT-VARIANT-SERVICE-07: Cap nhat bien the va dong bo ton kho
  it('should update variant and sync stock when product changes', async () => {
    // Arrange
    const oldProduct = { id: 1 } as Product;
    const newProduct = { id: 2 } as Product;
    const variant = {
      id: 1,
      product: oldProduct,
      size: { id: 1 },
      color: { id: 1 },
      sku: 'A',
      price: 10,
      stock: 2,
      imageUrl: 'a.jpg',
    } as ProductVariant;

    variantRepo.findOne
      .mockResolvedValueOnce(variant)
      .mockResolvedValueOnce(null);
    productRepo.findOneBy.mockResolvedValue(newProduct);
    variantRepo.save.mockImplementation(async (value: ProductVariant) => value);
    productRepo.update.mockResolvedValue({} as any);

    // Act
    const updateDto: UpdateProductVariantDto = { id: 1, productId: 2, stock: 4 };
    const result = await service.update(updateDto);

    // Assert
    expect(result.product).toBe(newProduct);
    expect(productRepo.update).toHaveBeenCalledTimes(2);
    expect(productRepo.update).toHaveBeenNthCalledWith(1, { id: 1 }, { stock: 0 });
    expect(productRepo.update).toHaveBeenNthCalledWith(2, { id: 2 }, { stock: 0 });
  });

  // TC-ADMIN-PRODUCT-VARIANT-SERVICE-08: Bao loi khi bien the dang co don hang
  it('should throw BadRequestException when variant is used in orders', async () => {
    // Arrange
    orderItemRepo.count.mockResolvedValue(1);

    // Act + Assert
    await expect(service.delete(5)).rejects.toThrow(BadRequestException);
    expect(orderItemRepo.count).toHaveBeenCalledWith({ where: { variant: { id: 5 } } });
  });

  // TC-ADMIN-PRODUCT-VARIANT-SERVICE-09: Bao loi khi bien the can xoa khong ton tai
  it('should throw NotFoundException when variant does not exist', async () => {
    // Arrange
    orderItemRepo.count.mockResolvedValue(0);
    variantRepo.findOne.mockResolvedValue(null);

    // Act + Assert
    await expect(service.delete(5)).rejects.toThrow(NotFoundException);
    expect(orderItemRepo.count).toHaveBeenCalledWith({ where: { variant: { id: 5 } } });
    expect(variantRepo.findOne).toHaveBeenCalledWith({
      where: { id: 5 },
      relations: ['product'],
    });
  });

  // TC-ADMIN-PRODUCT-VARIANT-SERVICE-10: Xoa bien the va dong bo ton kho
  it('should delete variant and sync stock when allowed', async () => {
    // Arrange
    const variant = { id: 5, product: { id: 8 } } as ProductVariant;
    orderItemRepo.count.mockResolvedValue(0);
    variantRepo.findOne.mockResolvedValue(variant);
    variantRepo.remove.mockResolvedValue(variant);
    productRepo.update.mockResolvedValue({} as any);

    // Act
    await service.delete(5);

    // Assert
    expect(variantRepo.remove).toHaveBeenCalledWith(variant);
    expect(productRepo.update).toHaveBeenCalledWith({ id: 8 }, { stock: 0 });
  });
});
