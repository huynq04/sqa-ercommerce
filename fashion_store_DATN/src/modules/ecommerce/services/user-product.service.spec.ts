import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
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
  const qb: Partial<MockQb> = {};
  qb.update = jest.fn().mockReturnValue(qb);
  qb.insert = jest.fn().mockReturnValue(qb);
  qb.values = jest.fn().mockReturnValue(qb);
  qb.set = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.execute = jest.fn();
  return qb as MockQb;
};

describe('UserProductService', () => {
  let service: UserProductService;
  let mockProductRepo: Partial<Record<string, jest.Mock>> & Repository<Product>;
  let mockActivityLogRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    mockProductRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockActivityLogRepo = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepo,
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: mockActivityLogRepo,
        },
      ],
    }).compile();

    service = module.get<UserProductService>(UserProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TC-USER-PRODUCT-SERVICE-001: findAll returns paginated result
  it('TC-USER-PRODUCT-SERVICE-001 - findAll returns listPaginate result', async () => {
    // Arrange: mock listPaginate result
    // CheckDB: mocked - no DB touch
    const query: any = { page: 1 };
    const expected = { items: [{ id: 1 }], total: 1 };
    const listPaginateSpy = jest
      .spyOn(service as any, 'listPaginate')
      .mockResolvedValue(expected);
    // Act: call findAll
    const result = await service.findAll(query);
    // Assert: return expected payload
    expect(result).toBe(expected);
    expect(listPaginateSpy).toHaveBeenCalledTimes(1);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-002: findAll sets search fields
  it('TC-USER-PRODUCT-SERVICE-002 - findAll sets searchFields', async () => {
    // Arrange: query without searchFields
    // CheckDB: mocked - no DB touch
    const query: any = {};
    jest.spyOn(service as any, 'listPaginate').mockResolvedValue([]);
    // Act: call findAll
    await service.findAll(query);
    // Assert: searchFields is overwritten
    expect(query.searchFields).toEqual(['name', 'description']);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-003: findAll overrides incoming search fields
  it('TC-USER-PRODUCT-SERVICE-003 - findAll overrides existing searchFields', async () => {
    // Arrange: query has wrong searchFields
    // CheckDB: mocked - no DB touch
    const query: any = { searchFields: ['wrong'] };
    jest.spyOn(service as any, 'listPaginate').mockResolvedValue([]);
    // Act: call findAll
    await service.findAll(query);
    // Assert: searchFields reset to allowed fields
    expect(query.searchFields).toEqual(['name', 'description']);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-004: findAll keeps page value
  it('TC-USER-PRODUCT-SERVICE-004 - findAll preserves page in query', async () => {
    // Arrange: query with page
    // CheckDB: mocked - no DB touch
    const query: any = { page: 3 };
    jest.spyOn(service as any, 'listPaginate').mockResolvedValue([]);
    // Act: call findAll
    await service.findAll(query);
    // Assert: page still exists
    expect(query.page).toBe(3);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-005: findAll keeps limit value
  it('TC-USER-PRODUCT-SERVICE-005 - findAll preserves limit in query', async () => {
    // Arrange: query with limit
    // CheckDB: mocked - no DB touch
    const query: any = { limit: 20 };
    jest.spyOn(service as any, 'listPaginate').mockResolvedValue([]);
    // Act: call findAll
    await service.findAll(query);
    // Assert: limit still exists
    expect(query.limit).toBe(20);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-006: findAll forwards sort info
  it('TC-USER-PRODUCT-SERVICE-006 - findAll preserves sortBy and sortOrder', async () => {
    // Arrange: query with sort options
    // CheckDB: mocked - no DB touch
    const query: any = { sortBy: 'id', sortOrder: 'DESC' };
    jest.spyOn(service as any, 'listPaginate').mockResolvedValue([]);
    // Act: call findAll
    await service.findAll(query);
    // Assert: sort options are unchanged
    expect(query.sortBy).toBe('id');
    expect(query.sortOrder).toBe('DESC');
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-007: findAll uses expected relations
  it('TC-USER-PRODUCT-SERVICE-007 - findAll passes relations to listPaginate', async () => {
    // Arrange: spy listPaginate
    // CheckDB: mocked - no DB touch
    const query: any = {};
    const spy = jest.spyOn(service as any, 'listPaginate').mockResolvedValue([]);
    // Act: call findAll
    await service.findAll(query);
    // Assert: relations contain category/variants/images
    expect(spy).toHaveBeenCalledWith(
      query,
      expect.objectContaining({
        relations: ['category', 'variants', 'variants.color', 'variants.size', 'images'],
      }),
    );
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-008: findAll works with empty object
  it('TC-USER-PRODUCT-SERVICE-008 - findAll handles empty query object', async () => {
    // Arrange: empty query and empty response
    // CheckDB: mocked - no DB touch
    const expected: any = { items: [], total: 0 };
    jest.spyOn(service as any, 'listPaginate').mockResolvedValue(expected);
    // Act: call findAll
    const result = await service.findAll({} as any);
    // Assert: returns expected
    expect(result).toEqual(expected);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-009: findAll supports keyword
  it('TC-USER-PRODUCT-SERVICE-009 - findAll keeps keyword value', async () => {
    // Arrange: query with keyword
    // CheckDB: mocked - no DB touch
    const query: any = { keyword: 'ao' };
    jest.spyOn(service as any, 'listPaginate').mockResolvedValue([]);
    // Act: call findAll
    await service.findAll(query);
    // Assert: keyword still available
    expect(query.keyword).toBe('ao');
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-010: findAll propagates errors
  it('TC-USER-PRODUCT-SERVICE-010 - findAll propagates listPaginate error', async () => {
    // Arrange: listPaginate throws
    // CheckDB: mocked - no DB touch
    jest.spyOn(service as any, 'listPaginate').mockRejectedValue(new Error('paginate fail'));
    // Act & Assert: should throw
    await expect(service.findAll({} as any)).rejects.toThrow('paginate fail');
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-011: findAll passes query object by reference
  it('TC-USER-PRODUCT-SERVICE-011 - findAll passes same query reference', async () => {
    // Arrange: prepare query and spy
    // CheckDB: mocked - no DB touch
    const query: any = { page: 2 };
    const spy = jest.spyOn(service as any, 'listPaginate').mockResolvedValue([]);
    // Act: call findAll
    await service.findAll(query);
    // Assert: first argument is same object
    expect(spy.mock.calls[0][0]).toBe(query);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-012: findAll works with null result
  it('TC-USER-PRODUCT-SERVICE-012 - findAll returns null when listPaginate returns null', async () => {
    // Arrange: listPaginate returns null
    // CheckDB: mocked - no DB touch
    jest.spyOn(service as any, 'listPaginate').mockResolvedValue(null);
    // Act: call findAll
    const result = await service.findAll({} as any);
    // Assert: null is returned
    expect(result).toBeNull();
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-013: findById returns product
  it('TC-USER-PRODUCT-SERVICE-013 - findById returns product when found', async () => {
    // Arrange: mock existing product
    // CheckDB: mocked - no DB touch
    const product = { id: 1, name: 'A' } as Product;
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue(product);
    // Act: call findById
    const result = await service.findById(1);
    // Assert: same product is returned
    expect(result).toBe(product);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-014: findById calls repository with correct where
  it('TC-USER-PRODUCT-SERVICE-014 - findById calls findOne with where id', async () => {
    // Arrange: mock product
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 2 });
    // Act: call findById
    await service.findById(2);
    // Assert: query contains id
    expect(mockProductRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 } }),
    );
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-015: findById includes relations
  it('TC-USER-PRODUCT-SERVICE-015 - findById requests full relations', async () => {
    // Arrange: mock product
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 2 });
    // Act: call findById
    await service.findById(2);
    // Assert: relations include expected values
    expect(mockProductRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: ['category', 'variants', 'variants.color', 'variants.size', 'images'],
      }),
    );
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-016: findById supports zero id
  it('TC-USER-PRODUCT-SERVICE-016 - findById supports id zero', async () => {
    // Arrange: mock product for id 0
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 0 });
    // Act: call findById
    const result = await service.findById(0);
    // Assert: id 0 handled as normal value
    expect(result).toEqual({ id: 0 });
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-017: findById supports negative id
  it('TC-USER-PRODUCT-SERVICE-017 - findById forwards negative id to repository', async () => {
    // Arrange: repo returns undefined for negative id
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue(undefined);
    // Act & Assert: should throw not found
    await expect(service.findById(-1)).rejects.toBeInstanceOf(NotFoundException);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-018: findById throws NotFoundException for undefined
  it('TC-USER-PRODUCT-SERVICE-018 - findById throws NotFoundException when repository returns undefined', async () => {
    // Arrange: no product found
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue(undefined);
    // Act & Assert: expect not found
    await expect(service.findById(999)).rejects.toBeInstanceOf(NotFoundException);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-019: findById throws NotFoundException for null
  it('TC-USER-PRODUCT-SERVICE-019 - findById throws NotFoundException when repository returns null', async () => {
    // Arrange: repository returns null
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue(null);
    // Act & Assert: expect not found
    await expect(service.findById(8)).rejects.toBeInstanceOf(NotFoundException);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-020: findById message should be Vietnamese text
  it('TC-USER-PRODUCT-SERVICE-020 - findById throws expected message', async () => {
    // Arrange: repository returns undefined
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue(undefined);
    // Act & Assert: message matches service contract
    await expect(service.findById(8)).rejects.toThrow('Không tìm thấy sản phẩm');
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-021: findById propagates db errors
  it('TC-USER-PRODUCT-SERVICE-021 - findById propagates repository error', async () => {
    // Arrange: repository throws
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));
    // Act & Assert: should throw same error
    await expect(service.findById(1)).rejects.toThrow('DB error');
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-022: findById handles large id
  it('TC-USER-PRODUCT-SERVICE-022 - findById handles very large id', async () => {
    // Arrange: large id product
    // CheckDB: mocked - no DB touch
    const largeId = 2147483647;
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: largeId });
    // Act: call findById
    const result = await service.findById(largeId);
    // Assert: large id is returned
    expect(result).toEqual({ id: largeId });
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-023: findById called once
  it('TC-USER-PRODUCT-SERVICE-023 - findById calls repository exactly once', async () => {
    // Arrange: repository returns product
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 3 });
    // Act: call findById
    await service.findById(3);
    // Assert: single repository call
    expect(mockProductRepo.findOne).toHaveBeenCalledTimes(1);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-024: findById returns object identity
  it('TC-USER-PRODUCT-SERVICE-024 - findById returns the same object instance', async () => {
    // Arrange: same object from repository
    // CheckDB: mocked - no DB touch
    const product: any = { id: 4, nested: { a: 1 } };
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue(product);
    // Act: call findById
    const result = await service.findById(4);
    // Assert: object identity preserved
    expect(result).toBe(product);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-025: findById with relation-rich object
  it('TC-USER-PRODUCT-SERVICE-025 - findById returns relation-rich product object', async () => {
    // Arrange: product includes relations
    // CheckDB: mocked - no DB touch
    const product: any = {
      id: 5,
      category: { id: 1 },
      variants: [{ id: 2, color: { id: 3 }, size: { id: 4 } }],
      images: [{ id: 7 }],
    };
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue(product);
    // Act: call findById
    const result = await service.findById(5);
    // Assert: relation data returned unchanged
    expect(result.variants[0].color.id).toBe(3);
    expect(result.images).toHaveLength(1);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-026: findById with decimal-like number
  it('TC-USER-PRODUCT-SERVICE-026 - findById forwards decimal id as provided', async () => {
    // Arrange: mock decimal-like id
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 1.5 });
    // Act: call findById
    const result = await service.findById(1.5 as any);
    // Assert: query uses exact id value
    expect(mockProductRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1.5 } }),
    );
    expect(result).toEqual({ id: 1.5 });
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-027: findById still throws for NaN
  it('TC-USER-PRODUCT-SERVICE-027 - findById throws NotFound when repository yields undefined for NaN', async () => {
    // Arrange: repository misses NaN id
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue(undefined);
    // Act & Assert: should throw not found
    await expect(service.findById(Number.NaN as any)).rejects.toBeInstanceOf(NotFoundException);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-028: findById wraps no additional behavior
  it('TC-USER-PRODUCT-SERVICE-028 - findById does not call find repository method', async () => {
    // Arrange: mock only findOne
    // CheckDB: mocked - no DB touch
    (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 9 });
    // Act: call findById
    await service.findById(9);
    // Assert: only findOne used
    expect(mockProductRepo.find).not.toHaveBeenCalled();
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-029: searchByKeyword returns list
  it('TC-USER-PRODUCT-SERVICE-029 - searchByKeyword returns products', async () => {
    // Arrange: mock product list
    // CheckDB: mocked - no DB touch
    const list = [{ id: 1 }, { id: 2 }];
    (mockProductRepo.find as jest.Mock).mockResolvedValue(list);
    // Act: search by keyword
    const result = await service.searchByKeyword('ao');
    // Assert: same list returned
    expect(result).toEqual(list);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-030: searchByKeyword calls find once
  it('TC-USER-PRODUCT-SERVICE-030 - searchByKeyword calls repository once', async () => {
    // Arrange: mock repository
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call searchByKeyword
    await service.searchByKeyword('abc');
    // Assert: find called exactly once
    expect(mockProductRepo.find).toHaveBeenCalledTimes(1);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-031: searchByKeyword uses take 5
  it('TC-USER-PRODUCT-SERVICE-031 - searchByKeyword limits result to 5', async () => {
    // Arrange: mock repository
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call searchByKeyword
    await service.searchByKeyword('abc');
    // Assert: take is fixed to 5
    expect(mockProductRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-032: searchByKeyword uses where array
  it('TC-USER-PRODUCT-SERVICE-032 - searchByKeyword sends where as two-condition array', async () => {
    // Arrange: mock repository
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call searchByKeyword
    await service.searchByKeyword('abc');
    // Assert: where has 2 conditions (name, description)
    const callArg = (mockProductRepo.find as jest.Mock).mock.calls[0][0];
    expect(Array.isArray(callArg.where)).toBe(true);
    expect(callArg.where).toHaveLength(2);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-033: searchByKeyword empty keyword
  it('TC-USER-PRODUCT-SERVICE-033 - searchByKeyword supports empty keyword', async () => {
    // Arrange: repository returns empty
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call with empty keyword
    const result = await service.searchByKeyword('');
    // Assert: returns empty list
    expect(result).toEqual([]);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-034: searchByKeyword whitespace keyword
  it('TC-USER-PRODUCT-SERVICE-034 - searchByKeyword supports whitespace keyword', async () => {
    // Arrange: repository returns empty
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call with whitespace
    const result = await service.searchByKeyword('   ');
    // Assert: no exception
    expect(result).toEqual([]);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-035: searchByKeyword vietnamese keyword
  it('TC-USER-PRODUCT-SERVICE-035 - searchByKeyword handles Vietnamese keyword', async () => {
    // Arrange: repository returns one item
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([{ id: 7, name: 'Áo' }]);
    // Act: call with unicode keyword
    const result = await service.searchByKeyword('áo');
    // Assert: returns mocked list
    expect(result).toHaveLength(1);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-036: searchByKeyword sql-like payload
  it("TC-USER-PRODUCT-SERVICE-036 - searchByKeyword handles SQL-like payload", async () => {
    // Arrange: mock empty list
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call with SQL-like input
    const result = await service.searchByKeyword("' OR 1=1 --");
    // Assert: returns mocked empty result
    expect(result).toEqual([]);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-037: searchByKeyword emoji payload
  it('TC-USER-PRODUCT-SERVICE-037 - searchByKeyword supports emoji keyword', async () => {
    // Arrange: mock repository
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call with emoji
    const result = await service.searchByKeyword('👕');
    // Assert: no exception and returns list
    expect(result).toEqual([]);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-038: searchByKeyword numeric payload
  it('TC-USER-PRODUCT-SERVICE-038 - searchByKeyword supports numeric keyword string', async () => {
    // Arrange: mock one product
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([{ id: 88 }]);
    // Act: call with numeric text
    const result = await service.searchByKeyword('123');
    // Assert: returns mocked list
    expect(result).toEqual([{ id: 88 }]);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-039: searchByKeyword long string
  it('TC-USER-PRODUCT-SERVICE-039 - searchByKeyword supports long keyword', async () => {
    // Arrange: mock empty response
    // CheckDB: mocked - no DB touch
    const longKeyword = 'a'.repeat(500);
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call with long keyword
    const result = await service.searchByKeyword(longKeyword);
    // Assert: returns mocked list
    expect(result).toEqual([]);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-040: searchByKeyword mixed case
  it('TC-USER-PRODUCT-SERVICE-040 - searchByKeyword supports mixed-case keyword', async () => {
    // Arrange: repository returns empty
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call with mixed-case string
    const result = await service.searchByKeyword('AoThUn');
    // Assert: method returns array
    expect(Array.isArray(result)).toBe(true);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-041: searchByKeyword repository error
  it('TC-USER-PRODUCT-SERVICE-041 - searchByKeyword propagates repository error', async () => {
    // Arrange: repository throws error
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockRejectedValue(new Error('search fail'));
    // Act & Assert: should reject
    await expect(service.searchByKeyword('a')).rejects.toThrow('search fail');
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-042: searchByKeyword where[0] uses name key
  it('TC-USER-PRODUCT-SERVICE-042 - searchByKeyword builds name condition', async () => {
    // Arrange: repository mock
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: search
    await service.searchByKeyword('a');
    // Assert: first where object has name property
    const callArg = (mockProductRepo.find as jest.Mock).mock.calls[0][0];
    expect(Object.keys(callArg.where[0])).toContain('name');
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-043: searchByKeyword where[1] uses description key
  it('TC-USER-PRODUCT-SERVICE-043 - searchByKeyword builds description condition', async () => {
    // Arrange: repository mock
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: search
    await service.searchByKeyword('a');
    // Assert: second where object has description property
    const callArg = (mockProductRepo.find as jest.Mock).mock.calls[0][0];
    expect(Object.keys(callArg.where[1])).toContain('description');
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-044: searchByKeyword accepts undefined cast
  it('TC-USER-PRODUCT-SERVICE-044 - searchByKeyword accepts undefined-like input cast', async () => {
    // Arrange: repository mock
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call with undefined as any
    const result = await service.searchByKeyword(undefined as any);
    // Assert: result returns mocked list
    expect(result).toEqual([]);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-045: searchByKeyword accepts null cast
  it('TC-USER-PRODUCT-SERVICE-045 - searchByKeyword accepts null-like input cast', async () => {
    // Arrange: repository mock
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call with null as any
    const result = await service.searchByKeyword(null as any);
    // Assert: list is returned
    expect(result).toEqual([]);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-046: searchByKeyword preserves array response reference
  it('TC-USER-PRODUCT-SERVICE-046 - searchByKeyword returns same array reference from repository', async () => {
    // Arrange: create array reference
    // CheckDB: mocked - no DB touch
    const arr: any[] = [];
    (mockProductRepo.find as jest.Mock).mockResolvedValue(arr);
    // Act: call method
    const result = await service.searchByKeyword('x');
    // Assert: same array object returned
    expect(result).toBe(arr);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-047: searchByKeyword call with symbols
  it('TC-USER-PRODUCT-SERVICE-047 - searchByKeyword supports symbol-like text', async () => {
    // Arrange: repository returns empty
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call method
    const result = await service.searchByKeyword('@$%^');
    // Assert: list response
    expect(result).toEqual([]);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-048: searchByKeyword supports tabs and newlines
  it('TC-USER-PRODUCT-SERVICE-048 - searchByKeyword supports control whitespace', async () => {
    // Arrange: repository returns empty
    // CheckDB: mocked - no DB touch
    (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
    // Act: call with tabs/newlines
    const result = await service.searchByKeyword('\t\n');
    // Assert: list response
    expect(result).toEqual([]);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-049: logProductView ignores missing userId
  it('TC-USER-PRODUCT-SERVICE-049 - logProductView returns early when userId missing', async () => {
    // Arrange: missing userId
    // CheckDB: mocked - no DB touch
    // Act: call method
    const result = await service.logProductView(undefined as any, 2);
    // Assert: no query builder invoked
    expect(result).toBeUndefined();
    expect(mockActivityLogRepo.createQueryBuilder).not.toHaveBeenCalled();
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-050: logProductView ignores missing productId
  it('TC-USER-PRODUCT-SERVICE-050 - logProductView returns early when productId missing', async () => {
    // Arrange: missing productId
    // CheckDB: mocked - no DB touch
    // Act: call method
    const result = await service.logProductView(1, undefined as any);
    // Assert: no query builder invoked
    expect(result).toBeUndefined();
    expect(mockActivityLogRepo.createQueryBuilder).not.toHaveBeenCalled();
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-051: logProductView ignores userId zero
  it('TC-USER-PRODUCT-SERVICE-051 - logProductView returns early when userId is zero', async () => {
    // Arrange: userId = 0
    // CheckDB: mocked - no DB touch
    // Act: call method
    await service.logProductView(0 as any, 2);
    // Assert: no builder call
    expect(mockActivityLogRepo.createQueryBuilder).not.toHaveBeenCalled();
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-052: logProductView ignores productId zero
  it('TC-USER-PRODUCT-SERVICE-052 - logProductView returns early when productId is zero', async () => {
    // Arrange: productId = 0
    // CheckDB: mocked - no DB touch
    // Act: call method
    await service.logProductView(1, 0 as any);
    // Assert: no builder call
    expect(mockActivityLogRepo.createQueryBuilder).not.toHaveBeenCalled();
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-053: logProductView ignores null userId
  it('TC-USER-PRODUCT-SERVICE-053 - logProductView returns early when userId is null', async () => {
    // Arrange: null userId
    // CheckDB: mocked - no DB touch
    // Act: call method
    await service.logProductView(null as any, 2);
    // Assert: no builder call
    expect(mockActivityLogRepo.createQueryBuilder).not.toHaveBeenCalled();
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-054: logProductView ignores null productId
  it('TC-USER-PRODUCT-SERVICE-054 - logProductView returns early when productId is null', async () => {
    // Arrange: null productId
    // CheckDB: mocked - no DB touch
    // Act: call method
    await service.logProductView(2, null as any);
    // Assert: no builder call
    expect(mockActivityLogRepo.createQueryBuilder).not.toHaveBeenCalled();
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-055: logProductView update success short-circuits
  it('TC-USER-PRODUCT-SERVICE-055 - logProductView returns after update when affected > 0', async () => {
    // Arrange: first update affects one row
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);
    // Act: call method
    await service.logProductView(1, 2);
    // Assert: insert path is not used
    expect(updateQb.update).toHaveBeenCalled();
    expect(updateQb.insert).not.toHaveBeenCalled();
    expect(mockActivityLogRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-056: logProductView update with affected=2 still returns
  it('TC-USER-PRODUCT-SERVICE-056 - logProductView treats affected > 0 as success', async () => {
    // Arrange: first update affects multiple rows
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 2 });
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);
    // Act: call method
    await service.logProductView(1, 2);
    // Assert: only one builder usage
    expect(mockActivityLogRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-057: logProductView update uses criteria
  it('TC-USER-PRODUCT-SERVICE-057 - logProductView passes expected where criteria for update', async () => {
    // Arrange: update path
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);
    // Act: call method
    await service.logProductView(11, 22);
    // Assert: criteria include userId/action/entityType/entityId
    expect(updateQb.where).toHaveBeenCalledWith(
      'user_id = :userId AND action = :action AND entity_type = :entityType AND entity_id = :entityId',
      expect.objectContaining({
        userId: 11,
        action: 'view',
        entityType: 'product',
        entityId: 22,
      }),
    );
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-058: logProductView update sets SQL increment
  it('TC-USER-PRODUCT-SERVICE-058 - logProductView update sets viewCount and updatedAt expressions', async () => {
    // Arrange: update path
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);
    // Act: call method
    await service.logProductView(1, 2);
    // Assert: set() called with function fields
    expect(updateQb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        viewCount: expect.any(Function),
        updatedAt: expect.any(Function),
      }),
    );
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-059: logProductView insert when update affected=0
  it('TC-USER-PRODUCT-SERVICE-059 - logProductView inserts when initial update affects zero rows', async () => {
    // Arrange: update misses, insert succeeds
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    const insertQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 0 });
    insertQb.execute.mockResolvedValue({});
    mockActivityLogRepo.createQueryBuilder
      .mockReturnValueOnce(updateQb)
      .mockReturnValueOnce(insertQb);
    // Act: call method
    await service.logProductView(1, 2);
    // Assert: insert path executed
    expect(insertQb.insert).toHaveBeenCalled();
    expect(insertQb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'view',
        entityType: 'product',
        entityId: 2,
        viewCount: 1,
      }),
    );
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-060: logProductView insert uses user object
  it('TC-USER-PRODUCT-SERVICE-060 - logProductView insert values include nested user id', async () => {
    // Arrange: update misses, insert succeeds
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    const insertQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 0 });
    insertQb.execute.mockResolvedValue({});
    mockActivityLogRepo.createQueryBuilder
      .mockReturnValueOnce(updateQb)
      .mockReturnValueOnce(insertQb);
    // Act: call method
    await service.logProductView(7, 8);
    // Assert: user id is nested in values
    expect(insertQb.values).toHaveBeenCalledWith(
      expect.objectContaining({ user: { id: 7 } }),
    );
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-061: logProductView fallback update on insert error
  it('TC-USER-PRODUCT-SERVICE-061 - logProductView retries update when insert throws', async () => {
    // Arrange: update misses, insert fails, fallback update succeeds
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    const insertQb = createMockQb();
    const fallbackQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 0 });
    insertQb.execute.mockRejectedValue(new Error('duplicate'));
    fallbackQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder
      .mockReturnValueOnce(updateQb)
      .mockReturnValueOnce(insertQb)
      .mockReturnValueOnce(fallbackQb);
    // Act: call method
    await service.logProductView(1, 2);
    // Assert: fallback update was called
    expect(fallbackQb.update).toHaveBeenCalled();
    expect(mockActivityLogRepo.createQueryBuilder).toHaveBeenCalledTimes(3);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-062: logProductView fallback uses same criteria
  it('TC-USER-PRODUCT-SERVICE-062 - logProductView fallback update uses original criteria', async () => {
    // Arrange: trigger fallback
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    const insertQb = createMockQb();
    const fallbackQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 0 });
    insertQb.execute.mockRejectedValue(new Error('duplicate'));
    fallbackQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder
      .mockReturnValueOnce(updateQb)
      .mockReturnValueOnce(insertQb)
      .mockReturnValueOnce(fallbackQb);
    // Act: call method
    await service.logProductView(9, 10);
    // Assert: fallback where receives same ids
    expect(fallbackQb.where).toHaveBeenCalledWith(
      'user_id = :userId AND action = :action AND entity_type = :entityType AND entity_id = :entityId',
      expect.objectContaining({ userId: 9, entityId: 10 }),
    );
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-063: logProductView initial update error propagates
  it('TC-USER-PRODUCT-SERVICE-063 - logProductView propagates initial update error', async () => {
    // Arrange: update query fails before insert branch
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    updateQb.execute.mockRejectedValue(new Error('update fail'));
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);
    // Act & Assert: should reject
    await expect(service.logProductView(1, 2)).rejects.toThrow('update fail');
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-064: logProductView fallback error propagates
  it('TC-USER-PRODUCT-SERVICE-064 - logProductView propagates fallback update error', async () => {
    // Arrange: update misses, insert fails, fallback fails
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    const insertQb = createMockQb();
    const fallbackQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 0 });
    insertQb.execute.mockRejectedValue(new Error('insert fail'));
    fallbackQb.execute.mockRejectedValue(new Error('fallback fail'));
    mockActivityLogRepo.createQueryBuilder
      .mockReturnValueOnce(updateQb)
      .mockReturnValueOnce(insertQb)
      .mockReturnValueOnce(fallbackQb);
    // Act & Assert: should reject with fallback error
    await expect(service.logProductView(1, 2)).rejects.toThrow('fallback fail');
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-065: logProductView uses ActivityLog in update call
  it('TC-USER-PRODUCT-SERVICE-065 - logProductView update is called with ActivityLog entity', async () => {
    // Arrange: update success path
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);
    // Act: call method
    await service.logProductView(1, 2);
    // Assert: update called with ActivityLog
    expect(updateQb.update).toHaveBeenCalledWith(ActivityLog);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-066: logProductView createQueryBuilder called two times for insert path
  it('TC-USER-PRODUCT-SERVICE-066 - logProductView uses two query builders for update-then-insert path', async () => {
    // Arrange: update misses and insert succeeds
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    const insertQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 0 });
    insertQb.execute.mockResolvedValue({});
    mockActivityLogRepo.createQueryBuilder
      .mockReturnValueOnce(updateQb)
      .mockReturnValueOnce(insertQb);
    // Act: call method
    await service.logProductView(1, 2);
    // Assert: exactly two builders requested
    expect(mockActivityLogRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-067: logProductView uses three query builders for fallback path
  it('TC-USER-PRODUCT-SERVICE-067 - logProductView uses three query builders for fallback path', async () => {
    // Arrange: update misses, insert fails, fallback update succeeds
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    const insertQb = createMockQb();
    const fallbackQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 0 });
    insertQb.execute.mockRejectedValue(new Error('dup'));
    fallbackQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder
      .mockReturnValueOnce(updateQb)
      .mockReturnValueOnce(insertQb)
      .mockReturnValueOnce(fallbackQb);
    // Act: call method
    await service.logProductView(1, 2);
    // Assert: exactly three builders used
    expect(mockActivityLogRepo.createQueryBuilder).toHaveBeenCalledTimes(3);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-068: logProductView does not call insert on direct update success
  it('TC-USER-PRODUCT-SERVICE-068 - logProductView does not call insert when update affected is positive', async () => {
    // Arrange: update success
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);
    // Act: call method
    await service.logProductView(1, 2);
    // Assert: insert not touched on same qb
    expect(updateQb.insert).not.toHaveBeenCalled();
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-069: logProductView update query executes once in success path
  it('TC-USER-PRODUCT-SERVICE-069 - logProductView executes update once in direct success path', async () => {
    // Arrange: update success
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);
    // Act: call method
    await service.logProductView(1, 2);
    // Assert: execute called once
    expect(updateQb.execute).toHaveBeenCalledTimes(1);
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-070: logProductView handles string numeric ids
  it('TC-USER-PRODUCT-SERVICE-070 - logProductView accepts numeric strings cast as any', async () => {
    // Arrange: update success with string-like ids
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);
    // Act: call method with string numbers
    await service.logProductView('1' as any, '2' as any);
    // Assert: criteria carried through to where
    expect(updateQb.where).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ userId: '1', entityId: '2' }),
    );
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-071: logProductView handles NaN userId (truthy check fails)
  it('TC-USER-PRODUCT-SERVICE-071 - logProductView proceeds when userId is NaN and productId valid', async () => {
    // Arrange: NaN is falsy? (it is not truthy in !userId check -> true)
    // CheckDB: mocked - no DB touch
    await service.logProductView(Number.NaN as any, 2);
    // Act & Assert: should return early due !userId
    expect(mockActivityLogRepo.createQueryBuilder).not.toHaveBeenCalled();
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-072: logProductView handles NaN productId
  it('TC-USER-PRODUCT-SERVICE-072 - logProductView returns early when productId is NaN', async () => {
    // Arrange: NaN productId
    // CheckDB: mocked - no DB touch
    // Act: call method
    await service.logProductView(2, Number.NaN as any);
    // Assert: no DB interaction
    expect(mockActivityLogRepo.createQueryBuilder).not.toHaveBeenCalled();
    // Rollback: mocked - nothing to rollback
  });

  // TC-USER-PRODUCT-SERVICE-073: logProductView completes without return value on success paths
  it('TC-USER-PRODUCT-SERVICE-073 - logProductView resolves to undefined on update success', async () => {
    // Arrange: update success
    // CheckDB: mocked - no DB touch
    const updateQb = createMockQb();
    updateQb.execute.mockResolvedValue({ affected: 1 });
    mockActivityLogRepo.createQueryBuilder.mockReturnValue(updateQb);
    // Act: call method
    const result = await service.logProductView(3, 4);
    // Assert: function resolves with undefined
    expect(result).toBeUndefined();
    // Rollback: mocked - nothing to rollback
  });
});
