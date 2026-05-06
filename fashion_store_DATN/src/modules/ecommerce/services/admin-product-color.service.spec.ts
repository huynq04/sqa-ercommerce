import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AdminProductColorService } from './admin-product-color.service';

const createColorRepoMock = () => ({
  findOne: jest.fn<(...args: any[]) => any>(),
  findOneBy: jest.fn<(...args: any[]) => any>(),
  find: jest.fn<(...args: any[]) => any>(),
  create: jest.fn<(...args: any[]) => any>(),
  save: jest.fn<(...args: any[]) => any>(),
  remove: jest.fn<(...args: any[]) => any>(),
});

describe('AdminProductColorService', () => {
  let service: AdminProductColorService;
  let colorRepo: ReturnType<typeof createColorRepoMock>;

  beforeEach(() => {
    colorRepo = createColorRepoMock();
    service = new AdminProductColorService(colorRepo as any);
  });

  it('create throws ConflictException when color already exists', async () => {
    colorRepo.findOne.mockResolvedValue({ id: 1, color: 'Red' });

    await expect(service.create({ color: 'Red' } as any)).rejects.toThrow(
      ConflictException,
    );
  });

  it('create saves new color when unique', async () => {
    const created = { id: 2, color: 'Blue' };
    colorRepo.findOne.mockResolvedValue(null);
    colorRepo.create.mockReturnValue(created);
    colorRepo.save.mockResolvedValue(created);

    const result = await service.create({ color: 'Blue' } as any);

    expect(colorRepo.create).toHaveBeenCalledWith({ color: 'Blue' });
    expect(result).toEqual(created);
  });

  it('update throws NotFoundException when target does not exist', async () => {
    colorRepo.findOneBy.mockResolvedValue(null);

    await expect(
      service.update({ id: 99, color: 'Green' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('update throws ConflictException when new color duplicates another', async () => {
    colorRepo.findOneBy.mockResolvedValue({ id: 1, color: 'Black' });
    colorRepo.findOne.mockResolvedValue({ id: 2, color: 'White' });

    await expect(
      service.update({ id: 1, color: 'White' } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('update saves when color changed to unique value', async () => {
    const existing = { id: 1, color: 'Black' };
    colorRepo.findOneBy.mockResolvedValue(existing);
    colorRepo.findOne.mockResolvedValue(null);
    colorRepo.save.mockImplementation(async (value: any) => value);

    const result = await service.update({ id: 1, color: 'Navy' } as any);

    expect(result.color).toBe('Navy');
  });

  it('delete removes color when found', async () => {
    const existing = { id: 10, color: 'Olive' };
    colorRepo.findOneBy.mockResolvedValue(existing);
    colorRepo.remove.mockResolvedValue(existing);

    await service.delete(10);

    expect(colorRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('findAll returns sorted colors', async () => {
    const list = [{ id: 1, color: 'A' }];
    colorRepo.find.mockResolvedValue(list);

    const result = await service.findAll();

    expect(colorRepo.find).toHaveBeenCalledWith({ order: { color: 'ASC' } });
    expect(result).toBe(list);
  });
});
