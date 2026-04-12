import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AdminProductImageService } from './admin-product-image.service';

const createImageRepoMock = () => ({
  findOne: jest.fn<(...args: any[]) => any>(),
  create: jest.fn<(...args: any[]) => any>(),
  save: jest.fn<(...args: any[]) => any>(),
  update: jest.fn<(...args: any[]) => any>(),
  remove: jest.fn<(...args: any[]) => any>(),
});

const createProductRepoMock = () => ({
  findOne: jest.fn<(...args: any[]) => any>(),
  save: jest.fn<(...args: any[]) => any>(),
});

describe('AdminProductImageService', () => {
  let service: AdminProductImageService;
  let imageRepo: ReturnType<typeof createImageRepoMock>;
  let productRepo: ReturnType<typeof createProductRepoMock>;

  beforeEach(() => {
    imageRepo = createImageRepoMock();
    productRepo = createProductRepoMock();
    service = new AdminProductImageService(imageRepo as any, productRepo as any);
  });

  it('addImage throws NotFoundException when product is missing', async () => {
    productRepo.findOne.mockResolvedValue(null);

    await expect(
      service.addImage({ productId: 1, imageUrl: 'a.jpg', isMain: false } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('addImage with isMain=true resets old main image and updates product', async () => {
    const product = { id: 1, images: [], mainImageUrl: null };
    const image = { id: 11, imageUrl: 'main.jpg', isMain: true, product };
    productRepo.findOne.mockResolvedValue(product);
    imageRepo.update.mockResolvedValue({});
    productRepo.save.mockResolvedValue(product);
    imageRepo.create.mockReturnValue(image);
    imageRepo.save.mockResolvedValue(image);

    const result = await service.addImage({
      productId: 1,
      imageUrl: 'main.jpg',
      isMain: true,
    } as any);

    expect(imageRepo.update).toHaveBeenCalled();
    expect(productRepo.save).toHaveBeenCalled();
    expect(result.imageUrl).toBe('main.jpg');
  });

  it('updateImage throws NotFoundException when image is missing', async () => {
    imageRepo.findOne.mockResolvedValue(null);

    await expect(service.updateImage(99, { imageUrl: 'x.jpg' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updateImage can demote main image and promote next image', async () => {
    const product = { id: 2, mainImageUrl: 'old-main.jpg' };
    const current = { id: 20, product, imageUrl: 'old-main.jpg', isMain: true };
    const next = { id: 21, product, imageUrl: 'next.jpg', isMain: false };

    imageRepo.findOne
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(next);
    imageRepo.save.mockImplementation(async (value: any) => value);
    productRepo.save.mockResolvedValue(product);

    const result = await service.updateImage(20, { isMain: false } as any);

    expect(imageRepo.save).toHaveBeenCalledWith(next);
    expect(productRepo.save).toHaveBeenCalled();
    expect(result.message).toContain('thay');
  });

  it('deleteImage removes sub image', async () => {
    const product = { id: 7, mainImageUrl: 'main.jpg' };
    const subImage = { id: 31, product, imageUrl: 'sub.jpg', isMain: false };
    imageRepo.findOne.mockResolvedValue(subImage);
    imageRepo.remove.mockResolvedValue(subImage);

    const result = await service.deleteImage(31);

    expect(imageRepo.remove).toHaveBeenCalledWith(subImage);
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('deleteImage removes main image and promotes next image when available', async () => {
    const product = { id: 8, mainImageUrl: 'main.jpg' };
    const mainImage = { id: 41, product, imageUrl: 'main.jpg', isMain: true };
    const nextImage = { id: 42, product, imageUrl: 'next.jpg', isMain: false };

    imageRepo.findOne
      .mockResolvedValueOnce(mainImage)
      .mockResolvedValueOnce(nextImage);
    imageRepo.save.mockImplementation(async (value: any) => value);
    productRepo.save.mockResolvedValue(product);
    imageRepo.remove.mockResolvedValue(mainImage);

    const result = await service.deleteImage(41);

    expect(imageRepo.save).toHaveBeenCalledWith(nextImage);
    expect(productRepo.save).toHaveBeenCalled();
    expect(result.message).toContain('(');
  });
});
