import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '@modules/ecommerce/entities/productImage.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';
import {
  UpdateProductImageDto,
  UploadProductImageDto,
} from '@modules/ecommerce/dtos/upload-product-image.dto';
import { AdminProductImageService } from './admin-product-image.service';

describe('AdminProductImageService', () => {
  let service: AdminProductImageService;
  let imageRepo: jest.Mocked<Repository<ProductImage>>;
  let productRepo: jest.Mocked<Repository<Product>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProductImageService,
        {
          provide: getRepositoryToken(ProductImage),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdminProductImageService);
    imageRepo = module.get(getRepositoryToken(ProductImage));
    productRepo = module.get(getRepositoryToken(Product));
    jest.clearAllMocks();
  });

  // TC-ADMIN-PRODUCT-IMAGE-SERVICE-01: Bao loi khi san pham khong ton tai
  it('should throw NotFoundException when product is missing', async () => {
    // Arrange
    const uploadDto: UploadProductImageDto = {
      productId: 1,
      imageUrl: 'a.jpg',
      isMain: false,
    };
    productRepo.findOne.mockResolvedValue(null);

    // Act + Assert
    await expect(service.addImage(uploadDto)).rejects.toThrow(NotFoundException);
    expect(productRepo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['images'],
    });
  });

  // TC-ADMIN-PRODUCT-IMAGE-SERVICE-02: Them anh chinh va reset anh chinh cu
  it('should reset old main image when adding new main image', async () => {
    // Arrange
    const product = { id: 1, images: [], mainImageUrl: null } as Product;
    const image = {
      id: 11,
      imageUrl: 'main.jpg',
      isMain: true,
      product,
    } as ProductImage;
    productRepo.findOne.mockResolvedValue(product);
    imageRepo.update.mockResolvedValue({} as any);
    productRepo.save.mockResolvedValue(product);
    imageRepo.create.mockReturnValue(image);
    imageRepo.save.mockResolvedValue(image);

    // Act
    const uploadDto: UploadProductImageDto = {
      productId: 1,
      imageUrl: 'main.jpg',
      isMain: true,
    };
    const result = await service.addImage(uploadDto);

    // Assert
    expect(imageRepo.update).toHaveBeenCalled();
    expect(productRepo.save).toHaveBeenCalledWith(product);
    expect(imageRepo.save).toHaveBeenCalledWith(image);
    expect(result.imageUrl).toBe('main.jpg');
  });

  // TC-ADMIN-PRODUCT-IMAGE-SERVICE-03: Bao loi khi anh can cap nhat khong ton tai
  it('should throw NotFoundException when image is missing on update', async () => {
    // Arrange
    const updateDto: UpdateProductImageDto = { imageUrl: 'x.jpg' };
    imageRepo.findOne.mockResolvedValue(null);

    // Act + Assert
    await expect(service.updateImage(99, updateDto)).rejects.toThrow(
      NotFoundException,
    );
    expect(imageRepo.findOne).toHaveBeenCalledWith({
      where: { id: 99 },
      relations: ['product'],
    });
  });

  // TC-ADMIN-PRODUCT-IMAGE-SERVICE-04: Ha anh chinh va chon anh khac thay the
  it('should demote main image and promote next image when needed', async () => {
    // Arrange
    const product = { id: 2, mainImageUrl: 'old-main.jpg' } as Product;
    const current = {
      id: 20,
      product,
      imageUrl: 'old-main.jpg',
      isMain: true,
    } as ProductImage;
    const next = {
      id: 21,
      product,
      imageUrl: 'next.jpg',
      isMain: false,
    } as ProductImage;

    imageRepo.findOne
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(next);
    imageRepo.save.mockImplementation(async (value: ProductImage) => value);
    productRepo.save.mockResolvedValue(product);

    // Act
    const updateDto: UpdateProductImageDto = { isMain: false };
    const result = await service.updateImage(20, updateDto);

    // Assert
    expect(imageRepo.save).toHaveBeenCalledWith(next);
    expect(productRepo.save).toHaveBeenCalledWith(product);
    expect(result.message).toContain('thay');
  });

  // TC-ADMIN-PRODUCT-IMAGE-SERVICE-05: Xoa anh phu
  it('should delete sub image', async () => {
    // Arrange
    const product = { id: 7, mainImageUrl: 'main.jpg' } as Product;
    const subImage = {
      id: 31,
      product,
      imageUrl: 'sub.jpg',
      isMain: false,
    } as ProductImage;
    imageRepo.findOne.mockResolvedValue(subImage);
    imageRepo.remove.mockResolvedValue(subImage);

    // Act
    const result = await service.deleteImage(31);

    // Assert
    expect(imageRepo.remove).toHaveBeenCalledWith(subImage);
    expect(result.message).toBeTruthy();
  });

  // TC-ADMIN-PRODUCT-IMAGE-SERVICE-06: Xoa anh chinh va day anh khac len neu co
  it('should delete main image and promote next image when available', async () => {
    // Arrange
    const product = { id: 8, mainImageUrl: 'main.jpg' } as Product;
    const mainImage = {
      id: 41,
      product,
      imageUrl: 'main.jpg',
      isMain: true,
    } as ProductImage;
    const nextImage = {
      id: 42,
      product,
      imageUrl: 'next.jpg',
      isMain: false,
    } as ProductImage;

    imageRepo.findOne
      .mockResolvedValueOnce(mainImage)
      .mockResolvedValueOnce(nextImage);
    imageRepo.save.mockImplementation(async (value: ProductImage) => value);
    productRepo.save.mockResolvedValue(product);
    imageRepo.remove.mockResolvedValue(mainImage);

    // Act
    const result = await service.deleteImage(41);

    // Assert
    expect(imageRepo.save).toHaveBeenCalledWith(nextImage);
    expect(productRepo.save).toHaveBeenCalledWith(product);
    expect(result.message).toContain('(');
  });
});
