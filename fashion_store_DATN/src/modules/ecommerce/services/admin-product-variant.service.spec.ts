import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AdminProductVariantService } from './admin-product-variant.service';

const createVariantRepoMock = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const createProductRepoMock = () => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
});

const createLookupRepoMock = () => ({
  findOneBy: jest.fn(),
});

const createOrderItemRepoMock = () => ({
  count: jest.fn(),
});

describe('AdminProductVariantService', () => {
  let service: AdminProductVariantService;
  let variantRepo: ReturnType<typeof createVariantRepoMock>;
  let productRepo: ReturnType<typeof createProductRepoMock>;
  let sizeRepo: ReturnType<typeof createLookupRepoMock>;
  let colorRepo: ReturnType<typeof createLookupRepoMock>;
  let orderItemRepo: ReturnType<typeof createOrderItemRepoMock>;

  beforeEach(() => {
    variantRepo = createVariantRepoMock();
    productRepo = createProductRepoMock();
    sizeRepo = createLookupRepoMock();
    colorRepo = createLookupRepoMock();
    orderItemRepo = createOrderItemRepoMock();

    const qb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
    };
    variantRepo.createQueryBuilder.mockReturnValue(qb);

    service = new AdminProductVariantService(
      variantRepo as any,
      productRepo as any,
      sizeRepo as any,
      colorRepo as any,
      orderItemRepo as any,
    );
  });

  it('create throws NotFoundException when product is missing', async () => {
    productRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create({ productId: 1, sku: 'A', price: 1, stock: 1 } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('create throws BadRequestException when duplicate variant exists', async () => {
    productRepo.findOne.mockResolvedValue({ id: 1 });
    variantRepo.findOne.mockResolvedValue({ id: 10 });

    await expect(
      service.create({ productId: 1, sizeId: 2, colorId: 3, sku: 'A' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('create saves variant and syncs product stock', async () => {
    const product = { id: 1 };
    const size = { id: 2 };
    const color = { id: 3 };
    const variant = { id: 11, product, size, color, stock: 5 };

    productRepo.findOne.mockResolvedValue(product);
    variantRepo.findOne.mockResolvedValue(null);
    sizeRepo.findOneBy.mockResolvedValue(size);
    colorRepo.findOneBy.mockResolvedValue(color);
    variantRepo.create.mockReturnValue(variant);
    variantRepo.save.mockResolvedValue(variant);
    productRepo.update.mockResolvedValue({});

    const result = await service.create({
      productId: 1,
      sizeId: 2,
      colorId: 3,
      sku: 'SKU-1',
      price: 100,
      stock: 5,
      imageUrl: 'v.jpg',
    } as any);

    expect(result).toBe(variant);
    expect(productRepo.update).toHaveBeenCalledWith({ id: 1 }, { stock: 0 });
  });

  it('update throws NotFoundException when variant is missing', async () => {
    variantRepo.findOne.mockResolvedValue(null);

    await expect(service.update({ id: 99, sku: 'X' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update throws BadRequestException for duplicate combination', async () => {
    const variant = {
      id: 1,
      product: { id: 1 },
      size: { id: 1 },
      color: { id: 1 },
      sku: 'A',
      price: 10,
      stock: 2,
      imageUrl: 'a.jpg',
    };
    variantRepo.findOne.mockResolvedValueOnce(variant).mockResolvedValueOnce({ id: 2 });

    await expect(
      service.update({ id: 1, productId: 1, sizeId: 1, colorId: 1 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('update throws when new product does not exist', async () => {
    const variant = {
      id: 1,
      product: { id: 1 },
      size: { id: 1 },
      color: { id: 1 },
      sku: 'A',
      price: 10,
      stock: 2,
      imageUrl: 'a.jpg',
    };
    variantRepo.findOne.mockResolvedValueOnce(variant).mockResolvedValueOnce(null);
    productRepo.findOneBy.mockResolvedValue(null);

    await expect(service.update({ id: 1, productId: 2 } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update saves variant and syncs both products when product changes', async () => {
    const oldProduct = { id: 1 };
    const newProduct = { id: 2 };
    const variant = {
      id: 1,
      product: oldProduct,
      size: { id: 1 },
      color: { id: 1 },
      sku: 'A',
      price: 10,
      stock: 2,
      imageUrl: 'a.jpg',
    };

    variantRepo.findOne.mockResolvedValueOnce(variant).mockResolvedValueOnce(null);
    productRepo.findOneBy.mockResolvedValue(newProduct);
    variantRepo.save.mockImplementation(async (value: any) => value);
    productRepo.update.mockResolvedValue({});

    const result = await service.update({ id: 1, productId: 2, stock: 4 } as any);

    expect(result.product).toBe(newProduct);
    expect(productRepo.update).toHaveBeenCalledTimes(2);
    expect(productRepo.update).toHaveBeenNthCalledWith(1, { id: 1 }, { stock: 0 });
    expect(productRepo.update).toHaveBeenNthCalledWith(2, { id: 2 }, { stock: 0 });
  });

  it('delete throws BadRequestException when variant is used in orders', async () => {
    orderItemRepo.count.mockResolvedValue(1);

    await expect(service.delete(5)).rejects.toThrow(BadRequestException);
  });

  it('delete throws NotFoundException when variant does not exist', async () => {
    orderItemRepo.count.mockResolvedValue(0);
    variantRepo.findOne.mockResolvedValue(null);

    await expect(service.delete(5)).rejects.toThrow(NotFoundException);
  });

  it('delete removes variant and syncs stock', async () => {
    const variant = { id: 5, product: { id: 8 } };
    orderItemRepo.count.mockResolvedValue(0);
    variantRepo.findOne.mockResolvedValue(variant);
    variantRepo.remove.mockResolvedValue(variant);
    productRepo.update.mockResolvedValue({});

    await service.delete(5);

    expect(variantRepo.remove).toHaveBeenCalledWith(variant);
    expect(productRepo.update).toHaveBeenCalledWith({ id: 8 }, { stock: 0 });
  });
});
