import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import type { Repository } from 'typeorm';

import { BaseService } from './base.service';
import { PaginatedResult } from '@base/dtos/paginated-result.dto';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';

type TestEntity = {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  createdAt?: Date;
};

class TestBaseService extends BaseService<TestEntity> {
  // No extra methods; we just want to test BaseService.listPaginate
}

describe('BaseService', () => {
  let service: TestBaseService;

  const repoMock = {
    createQueryBuilder: jest.fn<(...args: any[]) => any>(),
  } as unknown as Repository<TestEntity>;

  const buildQueryBuilderMock = (overrides: Record<string, any> = {}) => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn<() => Promise<[TestEntity[], number]>>()
        .mockResolvedValue([[], 0]),
      ...overrides,
    };
    return qb;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TestBaseService(repoMock, 'u');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_BASE_SERVICE_001
  it('[TC_BASE_SERVICE_001] listPaginate dùng default order + pagination và trả PaginatedResult', async () => {
    const data: TestEntity[] = [{ id: 1 }, { id: 2 }];
    const qb = buildQueryBuilderMock({
      getManyAndCount: jest
        .fn<() => Promise<[TestEntity[], number]>>()
        .mockResolvedValue([data, 2]),
    });
    (repoMock.createQueryBuilder as any).mockReturnValue(qb);

    const result = await service.listPaginate();

    expect(repoMock.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(repoMock.createQueryBuilder).toHaveBeenCalledWith('u');

    // Default sort: createdAt DESC
    expect(qb.addOrderBy).toHaveBeenCalledWith('u.createdAt', 'DESC');

    // Default pagination: page=1, limit=10 => skip=0
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);

    expect(qb.getManyAndCount).toHaveBeenCalledTimes(1);

    expect(result).toBeInstanceOf(PaginatedResult);
    expect(result).toEqual({
      data,
      total: 2,
      page: 1,
      limit: 10,
    });
  });

  // Test Case ID: TC_BASE_SERVICE_002
  it('[TC_BASE_SERVICE_002] listPaginate áp dụng extra.where và bỏ qua null/undefined', async () => {
    const qb = buildQueryBuilderMock();
    (repoMock.createQueryBuilder as any).mockReturnValue(qb);

    await service.listPaginate(undefined, {
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        tenantId: undefined,
      },
    });

    expect(qb.andWhere).toHaveBeenCalledWith('u.status = :status', {
      status: 'ACTIVE',
    });

    // Ensure null/undefined are ignored
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      'u.deletedAt = :deletedAt',
      expect.anything(),
    );
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      'u.tenantId = :tenantId',
      expect.anything(),
    );
  });

  // Test Case ID: TC_BASE_SERVICE_003
  it('[TC_BASE_SERVICE_003] listPaginate áp dụng search (q + searchFields) và filter, bỏ qua filter rỗng', async () => {
    const qb = buildQueryBuilderMock();
    (repoMock.createQueryBuilder as any).mockReturnValue(qb);

    const query: QuerySpecificationDto<any> = {
      q: 'john',
      searchFields: ['name', 'email'],
      filter: {
        role: 'ADMIN',
        phone: '',
      },
    } as any;

    await service.listPaginate(query);

    expect(qb.andWhere).toHaveBeenCalledWith(
      '(u.name LIKE :q OR u.email LIKE :q)',
      { q: '%john%' },
    );

    expect(qb.andWhere).toHaveBeenCalledWith('u.role = :role', {
      role: 'ADMIN',
    });

    // Empty string filter is ignored
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      'u.phone = :phone',
      expect.anything(),
    );
  });

  // Test Case ID: TC_BASE_SERVICE_004
  it('[TC_BASE_SERVICE_004] listPaginate ưu tiên query.sort và map -1/1 sang DESC/ASC', async () => {
    const qb = buildQueryBuilderMock();
    (repoMock.createQueryBuilder as any).mockReturnValue(qb);

    const query: QuerySpecificationDto<any> = {
      sort: {
        createdAt: -1,
        name: 1,
      },
    } as any;

    await service.listPaginate(query);

    expect(qb.addOrderBy).toHaveBeenCalledWith('u.createdAt', 'DESC');
    expect(qb.addOrderBy).toHaveBeenCalledWith('u.name', 'ASC');

    // Only applies provided sort fields
    expect(qb.addOrderBy).toHaveBeenCalledTimes(2);
  });

  // Test Case ID: TC_BASE_SERVICE_005
  it('[TC_BASE_SERVICE_005] listPaginate dùng extra.order khi không có query.sort', async () => {
    const qb = buildQueryBuilderMock();
    (repoMock.createQueryBuilder as any).mockReturnValue(qb);

    await service.listPaginate(undefined, {
      order: {
        name: 'ASC',
      },
    });

    expect(qb.addOrderBy).toHaveBeenCalledWith('u.name', 'ASC');
    expect(qb.addOrderBy).not.toHaveBeenCalledWith('u.createdAt', 'DESC');
  });

  // Test Case ID: TC_BASE_SERVICE_006
  it('[TC_BASE_SERVICE_006] listPaginate join relations nested và không join trùng alias', async () => {
    const qb = buildQueryBuilderMock();
    (repoMock.createQueryBuilder as any).mockReturnValue(qb);

    await service.listPaginate(undefined, {
      relations: [
        'category',
        'variants',
        'variants.color',
        'variants.size',
        // duplicates
        'variants.color',
        'variants',
      ],
    });

    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('u.category', 'category');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('u.variants', 'variants');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'variants.color',
      'variants__color',
    );
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'variants.size',
      'variants__size',
    );

    // Only 4 unique aliases should be joined
    expect(qb.leftJoinAndSelect).toHaveBeenCalledTimes(4);
  });

  // Test Case ID: TC_BASE_SERVICE_007
  it('[TC_BASE_SERVICE_007] listPaginate áp dụng page/limit và trả meta đúng', async () => {
    const data: TestEntity[] = [{ id: 10 }];
    const qb = buildQueryBuilderMock({
      getManyAndCount: jest
        .fn<() => Promise<[TestEntity[], number]>>()
        .mockResolvedValue([data, 99]),
    });
    (repoMock.createQueryBuilder as any).mockReturnValue(qb);

    const query: QuerySpecificationDto<any> = { page: 3, limit: 5 } as any;

    const result = await service.listPaginate(query);

    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(5);

    expect(result).toEqual({
      data,
      total: 99,
      page: 3,
      limit: 5,
    });
  });
});
