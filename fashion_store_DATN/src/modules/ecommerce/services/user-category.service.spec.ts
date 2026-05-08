import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserCategoryService } from './user-category.service';
import { Category } from '../entities/category.entity';

describe('UserCategoryService', () => {
  let service: UserCategoryService;
  // Chỉ cần giả lập findOne vì các test ở đây tập trung vào findById.
  const mockRepo: any = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCategoryService,
        { provide: getRepositoryToken(Category), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UserCategoryService>(UserCategoryService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-USER-CATEGORY-SERVICE-001 - should set searchFields and call listPaginate', async () => {
    // Mô phỏng query chưa có tiêu chí tìm kiếm; service phải tự thêm trường tìm kiếm mặc định.
    const query: any = {};
    const expected = {
      items: [
        {
          id: 1,
          name: 'ao so mi',
          description: 'danh muc ao so mi',
          parent: null,
          children: [],
          products: [],
        },
      ],
      total: 1,
    };
    const spy = jest.spyOn(service as any, 'listPaginate').mockResolvedValue(expected);

    const result = await service.findAll(query);

    // Kiểm tra service đã ép search theo name/description và giữ đúng relations cho màn category tree.
    expect(query.searchFields).toEqual(['name', 'description']);
    expect(spy).toHaveBeenCalledWith(query, {
      relations: ['parent', 'children', 'products'],
    });
    // Kết quả trả ra phải đúng dữ liệu paginate mà listPaginate trả về.
    expect(result).toEqual(expected);
  });

  it('TC-USER-CATEGORY-SERVICE-002 - should handle undefined query in findAll', async () => {
    const expected = {
      items: [
        {
          id: 2,
          name: 'quan jean',
          description: 'danh muc quan jean',
          parent: null,
          children: [],
          products: [],
        },
      ],
      total: 1,
    };
    const spy = jest.spyOn(service as any, 'listPaginate').mockResolvedValue(expected);

    const result = await service.findAll(undefined);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ searchFields: ['name', 'description'] }),
      { relations: ['parent', 'children', 'products'] },
    );
    expect(result).toEqual(expected);
  });

  it('TC-USER-CATEGORY-SERVICE-003 - should bubble error when listPaginate fails', async () => {
    const query: any = { page: 1 };
    jest
      .spyOn(service as any, 'listPaginate')
      .mockRejectedValue(new Error('paginate fail'));

    await expect(service.findAll(query)).rejects.toThrow('paginate fail');
    expect(query.searchFields).toEqual(['name', 'description']);
  });

  it('TC-USER-CATEGORY-SERVICE-004 - should call repository with relations in findById', async () => {
    const category = {
      id: 5,
      name: 'phu kien',
      description: 'danh muc phu kien',
      parent: null,
      children: [],
      products: [],
    };
    mockRepo.findOne.mockResolvedValue(category);

    const result = await service.findById(5);

    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: 5 },
      relations: ['parent', 'children', 'products'],
    });
    expect(result).toEqual(category);
  });

  it('TC-USER-CATEGORY-SERVICE-005 - should throw NotFoundException when not found', async () => {
    // Giả lập repository không tìm thấy category.
    mockRepo.findOne.mockResolvedValue(null);

    // Service phải chuẩn hóa lỗi về NotFoundException để controller map ra HTTP 404.
    await expect(service.findById(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});
