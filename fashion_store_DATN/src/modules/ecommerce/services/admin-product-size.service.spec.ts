import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSize } from '@modules/ecommerce/entities/productSize.entity';
import {
  CreateProductSizeDto,
  UpdateProductSizeDto,
} from '@modules/ecommerce/dtos/product.dto';
import { AdminProductSizeService } from './admin-product-size.service';

describe('AdminProductSizeService', () => {
  let service: AdminProductSizeService;
  let sizeRepo: jest.Mocked<Repository<ProductSize>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProductSizeService,
        {
          provide: getRepositoryToken(ProductSize),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdminProductSizeService);
    sizeRepo = module.get(getRepositoryToken(ProductSize));
    jest.clearAllMocks();
  });

  // TC-ADMIN-PRODUCT-SIZE-SERVICE-01: Bao loi khi size da ton tai
  it('should throw ConflictException when size already exists', async () => {
    // Arrange
    const createDto: CreateProductSizeDto = { size: 'M' };
    sizeRepo.findOne.mockResolvedValue({ id: 1, size: 'M' } as ProductSize);

    // Act + Assert
    await expect(service.create(createDto)).rejects.toThrow(
      ConflictException,
    );
    expect(sizeRepo.findOne).toHaveBeenCalledWith({ where: { size: 'M' } });
  });

  // TC-ADMIN-PRODUCT-SIZE-SERVICE-02: Tao size moi khi khong bi trung
  it('should create and save new size', async () => {
    // Arrange
    const created = { id: 2, size: 'L' } as ProductSize;
    const createDto: CreateProductSizeDto = { size: 'L' };
    sizeRepo.findOne.mockResolvedValue(null);
    sizeRepo.create.mockReturnValue(created);
    sizeRepo.save.mockResolvedValue(created);

    // Act
    const result = await service.create(createDto);

    // Assert
    expect(sizeRepo.create).toHaveBeenCalledWith({ size: 'L' });
    expect(sizeRepo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });

  // TC-ADMIN-PRODUCT-SIZE-SERVICE-03: Bao loi khi size can cap nhat khong ton tai
  it('should throw NotFoundException when size is missing', async () => {
    // Arrange
    const updateDto: UpdateProductSizeDto = { id: 7, size: 'XL' };
    sizeRepo.findOneBy.mockResolvedValue(null);

    // Act + Assert
    await expect(service.update(updateDto)).rejects.toThrow(
      NotFoundException,
    );
    expect(sizeRepo.findOneBy).toHaveBeenCalledWith({ id: 7 });
  });

  // TC-ADMIN-PRODUCT-SIZE-SERVICE-04: Bao loi khi size moi bi trung
  it('should throw ConflictException when duplicate target exists', async () => {
    // Arrange
    const updateDto: UpdateProductSizeDto = { id: 1, size: 'XL' };
    sizeRepo.findOneBy.mockResolvedValue({ id: 1, size: 'M' } as ProductSize);
    sizeRepo.findOne.mockResolvedValue({ id: 3, size: 'XL' } as ProductSize);

    // Act + Assert
    await expect(service.update(updateDto)).rejects.toThrow(
      ConflictException,
    );
    expect(sizeRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(sizeRepo.findOne).toHaveBeenCalledWith({ where: { size: 'XL' } });
  });

  // TC-ADMIN-PRODUCT-SIZE-SERVICE-05: Cap nhat size khi gia tri moi la duy nhat
  it('should update and save size when value is unique', async () => {
    // Arrange
    const existing = { id: 1, size: 'S' } as ProductSize;
    const updateDto: UpdateProductSizeDto = { id: 1, size: 'XS' };
    sizeRepo.findOneBy.mockResolvedValue(existing);
    sizeRepo.findOne.mockResolvedValue(null);
    sizeRepo.save.mockImplementation(async (value: ProductSize) => value);

    // Act
    const result = await service.update(updateDto);

    // Assert
    expect(sizeRepo.save).toHaveBeenCalledWith(existing);
    expect(result.size).toBe('XS');
  });

  // TC-ADMIN-PRODUCT-SIZE-SERVICE-06: Xoa size khi tim thay
  it('should delete size when found', async () => {
    // Arrange
    const existing = { id: 3, size: 'XXL' } as ProductSize;
    sizeRepo.findOneBy.mockResolvedValue(existing);
    sizeRepo.remove.mockResolvedValue(existing);

    // Act
    await service.delete(3);

    // Assert
    expect(sizeRepo.findOneBy).toHaveBeenCalledWith({ id: 3 });
    expect(sizeRepo.remove).toHaveBeenCalledWith(existing);
  });

  // TC-ADMIN-PRODUCT-SIZE-SERVICE-07: Tra ve danh sach size sap xep
  it('should return sorted sizes', async () => {
    // Arrange
    const list = [{ id: 1, size: 'S' }] as ProductSize[];
    sizeRepo.find.mockResolvedValue(list);

    // Act
    const result = await service.findAll();

    // Assert
    expect(sizeRepo.find).toHaveBeenCalledWith({ order: { size: 'ASC' } });
    expect(result).toBe(list);
  });
});
