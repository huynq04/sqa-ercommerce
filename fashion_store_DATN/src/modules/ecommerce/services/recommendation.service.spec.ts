import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RecommendationService } from './recommendation.service';
import { Product } from '../entities/product.entity';
import { OrderItem } from '../entities/orderItem.entity';
import { AiRecommendationVector } from '../entities/aiRecommendationVector.entity';
import { ActivityLog } from '../entities/activityLog.entity';
import { RedisService } from '@base/db/redis/redis.service';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let productRepo: any;
  let orderItemRepo: any;
  let recVectorRepo: any;
  let activityLogRepo: any;
  let redisService: any;

  beforeEach(async () => {
    productRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    orderItemRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      })),
    };
    recVectorRepo = { find: jest.fn().mockResolvedValue([]) };
    activityLogRepo = { find: jest.fn() };
    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepo },
        { provide: getRepositoryToken(AiRecommendationVector), useValue: recVectorRepo },
        { provide: getRepositoryToken(ActivityLog), useValue: activityLogRepo },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-RECOMMENDATION-SERVICE-001 - returns popular products for new users', async () => {
    jest.spyOn(service as any, 'reloadOfflineModelIfChanged').mockImplementation(() => undefined);
    jest
      .spyOn(service as any, 'getUserPurchasedProducts')
      .mockResolvedValue({ purchasedProductIds: [], purchasedCategoryIds: [] });
    jest.spyOn(service as any, 'hasUserProductActivity').mockResolvedValue(false);
    jest.spyOn(service as any, 'getPopularProductIds').mockResolvedValue([101, 102, 103]);
    productRepo.find.mockResolvedValue([{ id: 101 }, { id: 102 }, { id: 103 }]);

    const result = await service.getRecommendations(1, 2);

    expect(result).toHaveLength(2);
    expect(productRepo.find).toHaveBeenCalled();
  });

  it('TC-RECOMMENDATION-SERVICE-002 - uses offline model when user has activity', async () => {
    jest.spyOn(service as any, 'reloadOfflineModelIfChanged').mockImplementation(() => undefined);
    jest
      .spyOn(service as any, 'getUserPurchasedProducts')
      .mockResolvedValue({ purchasedProductIds: [10], purchasedCategoryIds: [] });
    jest.spyOn(service as any, 'hasUserProductActivity').mockResolvedValue(true);
    jest.spyOn(service as any, 'getProductVectors').mockResolvedValue(new Map());
    jest.spyOn(service as any, 'getProductIdSet').mockResolvedValue(new Set([301, 302]));
    jest.spyOn(service as any, 'getPopularProductIds').mockResolvedValue([401, 402]);

    (service as any).offlineModel = {
      similar_by_item: { '10': [{ id: 301, score: 0.9 }, { id: 302, score: 0.7 }] },
      popular: [401, 402],
    };

    productRepo.find.mockResolvedValue([{ id: 301 }, { id: 302 }]);

    const result = await service.getRecommendations(5, 2);

    expect(result.map((x: any) => x.id)).toEqual([301, 302]);
  });

  it('TC-RECOMMENDATION-SERVICE-003 - computes cosine similarity and handles zero/length-mismatch', () => {
    const mismatch = (service as any).cosineSimilarity([1, 2, 3], [1, 2]);
    const equal = (service as any).cosineSimilarity([1, 1], [1, 1]);

    expect(mismatch).toBe(0);
    expect(equal).toBeCloseTo(1);
  });

  it('TC-RECOMMENDATION-SERVICE-004 - removes duplicate ids preserving first occurrences', () => {
    const out = (service as any).dedupe([1, 2, 1, 3, 2]);
    expect(out).toEqual([1, 2, 3]);
  });

  it('TC-RECOMMENDATION-SERVICE-005 - returns empty when no candidates and no popular fallback', async () => {
    jest.spyOn(service as any, 'reloadOfflineModelIfChanged').mockImplementation(() => undefined);
    jest
      .spyOn(service as any, 'getUserPurchasedProducts')
      .mockResolvedValue({ purchasedProductIds: [], purchasedCategoryIds: [] });
    jest.spyOn(service as any, 'hasUserProductActivity').mockResolvedValue(false);
    jest.spyOn(service as any, 'getPopularProductIds').mockResolvedValue([]);
    jest.spyOn(service as any, 'getProductIdSet').mockResolvedValue(new Set());

    const result = await service.getRecommendations(1, 5);

    expect(result).toEqual([]);
    expect(productRepo.find).not.toHaveBeenCalled();
  });

  it('TC-RECOMMENDATION-SERVICE-006 - getPopularProductIds falls back to latest products when no sales', async () => {
    productRepo.find.mockResolvedValue([{ id: 9 }, { id: 8 }]);

    const result = await (service as any).getPopularProductIds(2);

    expect(result).toEqual([9, 8]);
    expect(productRepo.find).toHaveBeenCalledWith({
      select: ['id'],
      take: 2,
      order: { id: 'DESC' },
    });
  });

  it('TC-RECOMMENDATION-SERVICE-007 - rerankByCategory prioritizes preferred category', async () => {
    productRepo.find.mockResolvedValue([
      { id: 1, categoryId: 10 },
      { id: 2, categoryId: 11 },
      { id: 3, categoryId: 10 },
    ]);

    const result = await (service as any).rerankByCategory([1, 2, 3], 10);

    expect(result).toEqual([1, 3, 2]);
  });

  it('TC-RECOMMENDATION-SERVICE-008 - getUserVector returns cached vector when versions match', async () => {
    jest.spyOn(service as any, 'getUserVectorVersions').mockResolvedValue({
      activityVersion: 1,
      purchaseVersion: 2,
    });
    redisService.get.mockResolvedValue({
      vector: [0.1, 0.2],
      activityVersion: 1,
      purchaseVersion: 2,
    });
    const eventSpy = jest.spyOn(service as any, 'getUserEventVectors');

    const result = await (service as any).getUserVector(1, [10], new Map());

    expect(result).toEqual([0.1, 0.2]);
    expect(eventSpy).not.toHaveBeenCalled();
    expect(redisService.set).not.toHaveBeenCalled();
  });

  it('TC-RECOMMENDATION-SERVICE-009 - getUserVector rebuilds and caches when versions changed', async () => {
    jest.spyOn(service as any, 'getUserVectorVersions').mockResolvedValue({
      activityVersion: 3,
      purchaseVersion: 4,
    });
    redisService.get.mockResolvedValue({
      vector: [0.1, 0.2],
      activityVersion: 1,
      purchaseVersion: 2,
    });
    jest
      .spyOn(service as any, 'getUserEventVectors')
      .mockResolvedValue([{ vector: [1, 1], weight: 1 }]);

    const result = await (service as any).getUserVector(
      1,
      [10],
      new Map([[10, [1, 1]]]),
    );

    expect(result).toEqual([1, 1]);
    expect(redisService.set).toHaveBeenCalledWith(
      'rec:uservec:1',
      {
        vector: [1, 1],
        activityVersion: 3,
        purchaseVersion: 4,
      },
      60 * 60,
    );
  });

  it('TC-RECOMMENDATION-SERVICE-010 - getUserEventVectors skips missing vectors and handles viewCount', async () => {
    activityLogRepo.find.mockResolvedValue([
      { entityId: 101, viewCount: undefined },
      { entityId: 999, viewCount: 2 },
    ]);
    const productVectors = new Map<number, number[]>([
      [101, [1, 0]],
      [202, [0, 1]],
    ]);

    const result = await (service as any).getUserEventVectors(1, [202], productVectors);

    expect(result.length).toBe(2);
    expect(result[0].weight).toBeGreaterThan(0);
  });

  it('TC-RECOMMENDATION-SERVICE-011 - getUserPurchasedProducts ignores items without product', async () => {
    orderItemRepo.find.mockResolvedValue([
      { variant: null },
      { variant: { product: null } },
      { variant: { product: { id: 11, categoryId: 5 } } },
      { variant: { product: { id: 11, categoryId: 5 } } },
    ]);

    const result = await (service as any).getUserPurchasedProducts(1);

    expect(result).toEqual({
      purchasedProductIds: [11],
      purchasedCategoryIds: [5],
    });
  });
});
