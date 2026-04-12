import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AdminProductSizeService } from './admin-product-size.service';

const createSizeRepoMock = () => ({
  findOne: jest.fn<(...args: any[]) => any>(),
  findOneBy: jest.fn<(...args: any[]) => any>(),
  find: jest.fn<(...args: any[]) => any>(),
  create: jest.fn<(...args: any[]) => any>(),
  save: jest.fn<(...args: any[]) => any>(),
  remove: jest.fn<(...args: any[]) => any>(),
});

describe('AdminProductSizeService', () => {
  let service: AdminProductSizeService;
  let sizeRepo: ReturnType<typeof createSizeRepoMock>;

  beforeEach(() => {
    sizeRepo = createSizeRepoMock();
    service = new AdminProductSizeService(sizeRepo as any);
  });

  it('create throws ConflictException when size already exists', async () => {
    sizeRepo.findOne.mockResolvedValue({ id: 1, size: 'M' });

    await expect(service.create({ size: 'M' } as any)).rejects.toThrow(
      ConflictException,
    );
  });

  it('create saves new size', async () => {
    const created = { id: 2, size: 'L' };
    sizeRepo.findOne.mockResolvedValue(null);
    sizeRepo.create.mockReturnValue(created);
    sizeRepo.save.mockResolvedValue(created);

    const result = await service.create({ size: 'L' } as any);

    expect(result).toEqual(created);
  });

  it('update throws NotFoundException when size is missing', async () => {
    sizeRepo.findOneBy.mockResolvedValue(null);

    await expect(service.update({ id: 7, size: 'XL' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update throws ConflictException when duplicate target exists', async () => {
    sizeRepo.findOneBy.mockResolvedValue({ id: 1, size: 'M' });
    sizeRepo.findOne.mockResolvedValue({ id: 3, size: 'XL' });

    await expect(service.update({ id: 1, size: 'XL' } as any)).rejects.toThrow(
      ConflictException,
    );
  });

  it('update saves changed size', async () => {
    const existing = { id: 1, size: 'S' };
    sizeRepo.findOneBy.mockResolvedValue(existing);
    sizeRepo.findOne.mockResolvedValue(null);
    sizeRepo.save.mockImplementation(async (value: any) => value);

    const result = await service.update({ id: 1, size: 'XS' } as any);

    expect(result.size).toBe('XS');
  });

  it('delete removes size when found', async () => {
    const existing = { id: 3, size: 'XXL' };
    sizeRepo.findOneBy.mockResolvedValue(existing);
    sizeRepo.remove.mockResolvedValue(existing);

    await service.delete(3);

    expect(sizeRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('findAll returns sorted sizes', async () => {
    const list = [{ id: 1, size: 'S' }];
    sizeRepo.find.mockResolvedValue(list);

    const result = await service.findAll();

    expect(sizeRepo.find).toHaveBeenCalledWith({ order: { size: 'ASC' } });
    expect(result).toBe(list);
  });
});
