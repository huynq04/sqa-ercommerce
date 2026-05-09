import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductColor } from '@modules/ecommerce/entities/productColor.entity';
import {
  CreateProductColorDto,
  UpdateProductColorDto,
} from '@modules/ecommerce/dtos/product.dto';
import { AdminProductColorService } from './admin-product-color.service';

describe('AdminProductColorService', () => {
  let service: AdminProductColorService;
  let colorRepo: jest.Mocked<Repository<ProductColor>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProductColorService,
        {
          provide: getRepositoryToken(ProductColor),
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

    service = module.get(AdminProductColorService);
    colorRepo = module.get(getRepositoryToken(ProductColor));
    jest.clearAllMocks();
  });

  // TC-ADMIN-PRODUCT-COLOR-SERVICE-01: Bao loi khi mau da ton tai
  it('should throw ConflictException when color already exists', async () => {
    // Arrange
    const createDto: CreateProductColorDto = { color: 'Red' };
    colorRepo.findOne.mockResolvedValue({ id: 1, color: 'Red' } as ProductColor);

    // Act + Assert
    await expect(service.create(createDto)).rejects.toThrow(
      ConflictException,
    );
    expect(colorRepo.findOne).toHaveBeenCalledWith({ where: { color: 'Red' } });
  });

  // TC-ADMIN-PRODUCT-COLOR-SERVICE-02: Tao mau moi khi khong bi trung
  it('should create and save new color when unique', async () => {
    // Arrange
    const created = { id: 2, color: 'Blue' } as ProductColor;
    const createDto: CreateProductColorDto = { color: 'Blue' };
    colorRepo.findOne.mockResolvedValue(null);
    colorRepo.create.mockReturnValue(created);
    colorRepo.save.mockResolvedValue(created);

    // Act
    const result = await service.create(createDto);

    // Assert
    expect(colorRepo.create).toHaveBeenCalledWith({ color: 'Blue' });
    expect(colorRepo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });

  // TC-ADMIN-PRODUCT-COLOR-SERVICE-03: Bao loi khi mau can cap nhat khong ton tai
  it('should throw NotFoundException when update target does not exist', async () => {
    // Arrange
    const updateDto: UpdateProductColorDto = { id: 99, color: 'Green' };
    colorRepo.findOneBy.mockResolvedValue(null);

    // Act + Assert
    await expect(service.update(updateDto)).rejects.toThrow(NotFoundException);
    expect(colorRepo.findOneBy).toHaveBeenCalledWith({ id: 99 });
  });

  // TC-ADMIN-PRODUCT-COLOR-SERVICE-04: Bao loi khi mau moi bi trung
  it('should throw ConflictException when new color duplicates another', async () => {
    // Arrange
    const updateDto: UpdateProductColorDto = { id: 1, color: 'White' };
    colorRepo.findOneBy.mockResolvedValue({ id: 1, color: 'Black' } as ProductColor);
    colorRepo.findOne.mockResolvedValue({ id: 2, color: 'White' } as ProductColor);

    // Act + Assert
    await expect(service.update(updateDto)).rejects.toThrow(ConflictException);
    expect(colorRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(colorRepo.findOne).toHaveBeenCalledWith({ where: { color: 'White' } });
  });

  // TC-ADMIN-PRODUCT-COLOR-SERVICE-05: Cap nhat mau khi gia tri moi la duy nhat
  it('should update and save when color changes to unique value', async () => {
    // Arrange
    const existing = { id: 1, color: 'Black' } as ProductColor;
    const updateDto: UpdateProductColorDto = { id: 1, color: 'Navy' };
    colorRepo.findOneBy.mockResolvedValue(existing);
    colorRepo.findOne.mockResolvedValue(null);
    colorRepo.save.mockImplementation(async (value: ProductColor) => value);

    // Act
    const result = await service.update(updateDto);

    // Assert
    expect(colorRepo.save).toHaveBeenCalledWith(existing);
    expect(result.color).toBe('Navy');
  });

  // TC-ADMIN-PRODUCT-COLOR-SERVICE-06: Xoa mau khi tim thay
  it('should delete color when found', async () => {
    // Arrange
    const existing = { id: 10, color: 'Olive' } as ProductColor;
    colorRepo.findOneBy.mockResolvedValue(existing);
    colorRepo.remove.mockResolvedValue(existing);

    // Act
    await service.delete(10);

    // Assert
    expect(colorRepo.findOneBy).toHaveBeenCalledWith({ id: 10 });
    expect(colorRepo.remove).toHaveBeenCalledWith(existing);
  });

  // TC-ADMIN-PRODUCT-COLOR-SERVICE-07: Tra ve danh sach mau sap xep
  it('should return sorted colors', async () => {
    // Arrange
    const list = [{ id: 1, color: 'A' }] as ProductColor[];
    colorRepo.find.mockResolvedValue(list);

    // Act
    const result = await service.findAll();

    // Assert
    expect(colorRepo.find).toHaveBeenCalledWith({ order: { color: 'ASC' } });
    expect(result).toBe(list);
  });
});
