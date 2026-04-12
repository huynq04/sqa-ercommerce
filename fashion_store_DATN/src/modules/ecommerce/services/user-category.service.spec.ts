import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserCategoryService } from './user-category.service';
import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('UserCategoryService', () => {
  let service: UserCategoryService;
  let categoryRepository: jest.Mocked<Repository<Category>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserCategoryService>(UserCategoryService);
    categoryRepository = module.get(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================
  // findAll
  // =========================
  describe('findAll', () => {
    it('TC-001 - should set searchFields and call listPaginate', async () => {
      const expected = [{ id: 1 } as Category];

      const listPaginateSpy = jest
        .spyOn(service as any, 'listPaginate')
        .mockResolvedValue(expected);

      const query: any = {};

      const result = await service.findAll(query);

      expect(result).toBe(expected);
      expect(query.searchFields).toEqual(['name', 'description']);

      expect(listPaginateSpy).toHaveBeenCalledWith(query, {
        relations: ['parent', 'children', 'products'],
      });
    });

    it('TC-002 - should override existing searchFields', async () => {
      const listPaginateSpy = jest
        .spyOn(service as any, 'listPaginate')
        .mockResolvedValue([]);

      const query: any = {
        searchFields: ['wrong'],
      };

      await service.findAll(query);

      expect(query.searchFields).toEqual(['name', 'description']);
      expect(listPaginateSpy).toHaveBeenCalled();
    });

    it('TC-003 - should work with empty query object', async () => {
      const listPaginateSpy = jest
        .spyOn(service as any, 'listPaginate')
        .mockResolvedValue([]);

      const result = await service.findAll({} as any);

      expect(result).toEqual([]);
      expect(listPaginateSpy).toHaveBeenCalled();
    });
  });

  // =========================
  // findById
  // =========================
  describe('findById', () => {
    it('TC-004 - should return category when found', async () => {
      const mockCategory = { id: 5 } as Category;

      categoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findById(5);

      expect(result).toBe(mockCategory);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
        relations: ['parent', 'children', 'products'],
      });
    });

    it('TC-005 - should throw NotFoundException when not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-006 - should call repository with correct id', async () => {
      categoryRepository.findOne.mockResolvedValue({ id: 1 } as Category);

      await service.findById(123);

      expect(categoryRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 123 },
        }),
      );
    });

    it('TC-007 - should propagate unexpected errors from repository', async () => {
      categoryRepository.findOne.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.findById(1)).rejects.toThrow('DB error');
    });
  });

  it('TC-user-category-service-008 - findAll propagates listPaginate errors', async () => {
    // TC-user-category-service-008: should propagate listPaginate errors
    const listPaginateSpy = jest.spyOn(service as any, 'listPaginate').mockRejectedValue(new Error('paginate fail'));
    const query: any = {};
    await expect(service.findAll(query)).rejects.toThrow('paginate fail');
    expect(listPaginateSpy).toHaveBeenCalled();
  });

  it('TC-user-category-service-009 - findById called with numeric id only', async () => {
    // TC-user-category-service-009: ensure findById calls repo with numeric id
    categoryRepository.findOne.mockResolvedValue({ id: 7 } as Category);
    const res = await service.findById(Number('7'));
    expect(categoryRepository.findOne).toHaveBeenCalledWith({ where: { id: 7 }, relations: ['parent', 'children', 'products'] });
    expect(res).toEqual({ id: 7 } as Category);
  });
});