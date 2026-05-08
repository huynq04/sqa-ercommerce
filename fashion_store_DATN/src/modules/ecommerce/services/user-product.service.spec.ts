import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ILike } from 'typeorm';
import { UserProductService } from './user-product.service';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { ActivityLog } from '@modules/ecommerce/entities/activityLog.entity';

type MockQb = {
  update: jest.Mock;
  insert: jest.Mock;
  values: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  execute: jest.Mock;
};

const createMockQb = (): MockQb => {
  const qb: any = {};
  qb.update = jest.fn().mockReturnValue(qb);
  qb.insert = jest.fn().mockReturnValue(qb);
  qb.values = jest.fn().mockReturnValue(qb);
  qb.set = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.execute = jest.fn();
  return qb;
};

describe('UserProductService', () => {
  let service: UserProductService;
  let mockProductRepo: any;
  let mockActivityLogRepo: any;

  beforeEach(async () => {
    mockProductRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    mockActivityLogRepo = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProductService,
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(ActivityLog), useValue: mockActivityLogRepo },
      ],
    }).compile();

    service = module.get<UserProductService>(UserProductService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-USER-PRODUCT-SERVICE-001 - findAll returns listPaginate result', async () => {
    // Service phải ép search theo name + description để endpoint list luôn hỗ trợ keyword cơ bản.
    const query: any = {};
    const expected = {
      items: [
        {
          id: 1,
          name: 'ao khoac',
          description: 'mo ta ao khoac',
          category: { id: 10, name: 'outerwear' },
          variants: [
            {
              id: 100,
              color: { id: 1000, name: 'den' },
              size: { id: 2000, name: 'M' },
            },
          ],
          images: [{ id: 10000, url: 'image-1' }],
        },
      ],
      total: 1,
    };
    const spy = jest.spyOn(service as any, 'listPaginate').mockResolvedValue(expected);

    const result = await service.findAll(query);

    // Xác nhận options include đủ relations để render product list/detail không bị thiếu dữ liệu.
    expect(query.searchFields).toEqual(['name', 'description']);
    expect(spy).toHaveBeenCalledWith(
      query,
      expect.objectContaining({
        relations: ['category', 'variants', 'variants.color', 'variants.size', 'images'],
      }),
    );
    // Service phải trả đúng cấu trúc phân trang từ base service.
    expect(result).toEqual(expected);
  });

  it('TC-USER-PRODUCT-SERVICE-002 - findAll handles undefined query', async () => {
    // Query undefined vẫn phải chạy listPaginate với searchFields mặc định.
    const expected = {
      items: [
        {
          id: 2,
          name: 'ao thun',
          description: 'ao thun co tron',
          category: { id: 11, name: 'top' },
          variants: [
            {
              id: 101,
              color: { id: 1001, name: 'trang' },
              size: { id: 2001, name: 'L' },
            },
          ],
          images: [{ id: 10001, url: 'image-2' }],
        },
      ],
      total: 1,
    };
    const spy = jest.spyOn(service as any, 'listPaginate').mockResolvedValue(expected);

    const result = await service.findAll(undefined);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        searchFields: ['name', 'description'],
      }),
      expect.objectContaining({
        relations: ['category', 'variants', 'variants.color', 'variants.size', 'images'],
      }),
    );
    expect(result).toEqual(expected);
  });

  it('TC-USER-PRODUCT-SERVICE-003 - findAll should bubble error from listPaginate', async () => {
    const query: any = { page: 1 };
    const spy = jest
      .spyOn(service as any, 'listPaginate')
      .mockRejectedValue(new Error('paginate fail'));

    await expect(service.findAll(query)).rejects.toThrow('paginate fail');
    expect(query.searchFields).toEqual(['name', 'description']);
    expect(spy).toHaveBeenCalled();
  });

  it('TC-USER-PRODUCT-SERVICE-004 - findById returns product when found', async () => {
    // Có dữ liệu từ DB thì trả luôn object sản phẩm.
    const product = {
      id: 1,
      name: 'ao so mi',
      description: 'ao so mi tay dai',
      category: { id: 12, name: 'shirt' },
      variants: [
        {
          id: 102,
          color: { id: 1002, name: 'xanh' },
          size: { id: 2002, name: 'S' },
        },
      ],
      images: [{ id: 10002, url: 'image-3' }],
    };
    mockProductRepo.findOne.mockResolvedValue(product);

    const result = await service.findById(1);

    expect(result).toEqual(product);
  });

  it('TC-USER-PRODUCT-SERVICE-005 - findById throws NotFoundException when repository returns undefined', async () => {
    // Không có sản phẩm theo id -> phải ném NotFound để controller trả 404.
    mockProductRepo.findOne.mockResolvedValue(undefined);

    await expect(service.findById(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('TC-USER-PRODUCT-SERVICE-006 - searchByKeyword returns products', async () => {
    // Search nhanh ở home page: cần giới hạn 5 kết quả và tìm theo cả tên lẫn mô tả.
    const products = [
      { id: 1, name: 'ao khoac', description: 'mo ta 1' },
      { id: 2, name: 'ao thun', description: 'mo ta 2' },
      { id: 3, name: 'quan jean', description: 'mo ta 3' },
      { id: 4, name: 'vay', description: 'mo ta 4' },
      { id: 5, name: 'ao so mi', description: 'mo ta 5' },
    ];
    mockProductRepo.find.mockResolvedValue(products);

    const result = await service.searchByKeyword('ao');

    // where là mảng để OR-condition giữa name và description.
    expect(mockProductRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Array),
        take: 5,
      }),
    );
    expect(result).toEqual(products);
  });

  it('TC-USER-PRODUCT-SERVICE-007 - searchByKeyword should not query when keyword is empty', async () => {
    await service.searchByKeyword('');

    expect(mockProductRepo.find).not.toHaveBeenCalled();
  });

  it('TC-USER-PRODUCT-SERVICE-008 - searchByKeyword should ignore whitespace keyword', async () => {
    await service.searchByKeyword('   ');

    expect(mockProductRepo.find).not.toHaveBeenCalled();
  });

  it('TC-USER-PRODUCT-SERVICE-009 - searchByKeyword should throw if keyword is invalid', async () => {
    await expect(service.searchByKeyword(undefined as any)).rejects.toThrow();
  });

  it('TC-USER-PRODUCT-SERVICE-010 - searchByKeyword should trim keyword before search', async () => {
    mockProductRepo.find.mockResolvedValue([]);

    await service.searchByKeyword('  ao  ');

    const args = mockProductRepo.find.mock.calls[0][0];

    expect(args.where[0].name).toEqual(ILike('%ao%'));
  });

  it('TC-USER-PRODUCT-SERVICE-011 - logProductView returns early when userId missing', async () => {
    // Thiếu userId hoặc productId thì bỏ qua logging để tránh tạo dữ liệu rác.
    await service.logProductView(undefined as any, 2);
    await service.logProductView(1, undefined as any);

    expect(mockActivityLogRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('TC-USER-PRODUCT-SERVICE-012 - logProductView returns after update when affected > 0', async () => {
    // Trường hợp user đã từng xem sản phẩm: chỉ cần tăng view_count bản ghi hiện có.
    const updateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);

    await service.logProductView(1, 2);

    // Vì update thành công nên không được chạy nhánh insert.
    expect(updateQb.update).toHaveBeenCalledWith(ActivityLog);
    expect(updateQb.insert).not.toHaveBeenCalled();
    expect(mockActivityLogRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
  });

  it('TC-USER-PRODUCT-SERVICE-013 - logProductView inserts new activity when update affected = 0', async () => {
    // Trường hợp user chưa có log cho sản phẩm này: update không trúng bản ghi nào nên phải insert mới.
    const updateQb = createMockQb();
    const insertQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 0 });
    insertQb.execute.mockResolvedValue({ identifiers: [{ id: 1 }] });

    mockActivityLogRepo.createQueryBuilder
      .mockReturnValueOnce(updateQb)
      .mockReturnValueOnce(insertQb);

    await service.logProductView(7, 8);

    // Payload insert phải đầy đủ user/action/entity để phục vụ recommendation và analytics.
    expect(insertQb.insert).toHaveBeenCalled();
    expect(insertQb.values).toHaveBeenCalledWith({
      user: { id: 7 },
      action: 'view',
      entityType: 'product',
      entityId: 8,
      viewCount: 1,
    });
    expect(mockActivityLogRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
  });

  it('TC-USER-PRODUCT-SERVICE-014 - logProductView retries update when insert fails', async () => {
    const updateQb = createMockQb();
    const insertQb = createMockQb();
    const retryUpdateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 0 });
    insertQb.execute.mockRejectedValue(new Error('insert failed'));
    retryUpdateQb.execute.mockResolvedValue({ affected: 1 });

    mockActivityLogRepo.createQueryBuilder
      .mockReturnValueOnce(updateQb)
      .mockReturnValueOnce(insertQb)
      .mockReturnValueOnce(retryUpdateQb);

    await service.logProductView(9, 10);

    expect(insertQb.insert).toHaveBeenCalled();
    expect(retryUpdateQb.update).toHaveBeenCalledWith(ActivityLog);
    expect(mockActivityLogRepo.createQueryBuilder).toHaveBeenCalledTimes(3);
  });

  it('TC-USER-PRODUCT-SERVICE-015 - logProductView uses criteria in update where', async () => {
    const updateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);

    await service.logProductView(3, 4);

    expect(updateQb.where).toHaveBeenCalledWith(
      'user_id = :userId AND action = :action AND entity_type = :entityType AND entity_id = :entityId',
      expect.objectContaining({
        userId: 3,
        action: 'view',
        entityType: 'product',
        entityId: 4,
      }),
    );
  });
});
