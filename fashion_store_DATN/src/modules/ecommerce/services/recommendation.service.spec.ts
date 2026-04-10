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
      findOne: jest.fn(),
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
    activityLogRepo = { findOne: jest.fn(), find: jest.fn() };
    redisService = { get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(true) };

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

  describe('private helper: cosineSimilarity', () => {
    // TC-recommendation-001: cosineSimilarity returns correct value and handles edge cases
    it('TC-recommendation-001 - computes cosine similarity and handles zero/length-mismatch', () => {
      // Arrange: two simple vectors and mismatch
      const a = [1, 0];
      const b = [0, 1];
      // Act: call private method
      const simOrth = (service as any).cosineSimilarity(a, b);
      const simSame = (service as any).cosineSimilarity([1, 1], [1, 1]);
      const simMismatch = (service as any).cosineSimilarity([1, 2, 3], [1, 2]);

      // Assert
      expect(simOrth).toBeCloseTo(0);
      expect(simSame).toBeCloseTo(1);
      expect(simMismatch).toBe(0);
      // CheckDB: mocked - no DB touch
      // Rollback: mocked - nothing to rollback
    });
  });

  describe('private helper: dedupe', () => {
    // TC-recommendation-002: dedupe removes duplicates preserving order
    it('TC-recommendation-002 - removes duplicate ids preserving first occurrences', () => {
      // Arrange
      const ids = [1, 2, 3, 2, 1, 4];
      // Act
      const out = (service as any).dedupe(ids);
      // Assert
      expect(out).toEqual([1, 2, 3, 4]);
      // CheckDB: mocked
      // Rollback: mocked
    });
  });

  describe('private helper: getOfflineCandidates', () => {
    // TC-recommendation-003: returns [] when no offline model and uses similar_by_item when present
    it('TC-recommendation-003 - returns candidates from offline model and falls back to popular', () => {
      // Arrange: set offlineModel on instance
      (service as any).offlineModel = {
        similar_by_item: {
          '10': [{ id: 20, score: 0.9 }, { id: 21, score: 0.5 }],
        },
        popular: [30, 31, 20],
      };
      const productIdsInDb = new Set([20, 21, 30]);

      // Act: when productIds contains 10
      const res = (service as any).getOfflineCandidates([10], 5, productIdsInDb);

      // Assert: should return top similar candidate 20 (filtered by inventory)
      expect(res).toContain(20);
      // When offline yields none in inventory, should fall back to popular
      const res2 = (service as any).getOfflineCandidates([999], 2, productIdsInDb);
      expect(res2).toHaveLength(2);

      // CheckDB: mocked
      // Rollback: mocked
    });
  });

  describe('getRecommendations - new user fallback to popular', () => {
    // TC-recommendation-004: new user without behavior gets popular products
    it('TC-recommendation-004 - returns popular products for new users', async () => {
      // Arrange: spy internal helpers
      jest.spyOn(service as any, 'reloadOfflineModelIfChanged').mockImplementation(()=>undefined);
      jest.spyOn(service as any, 'getUserPurchasedProducts').mockResolvedValue({ purchasedProductIds: [], purchasedCategoryIds: [] });
      jest.spyOn(service as any, 'hasUserProductActivity').mockResolvedValue(false);
      jest.spyOn(service as any, 'getPopularProductIds').mockResolvedValue([101, 102, 103]);

      productRepo.find.mockResolvedValue([
        { id: 101 } as any,
        { id: 102 } as any,
        { id: 103 } as any,
      ]);

      // Act
      const out = await service.getRecommendations(123, 2);

      // Assert: should call productRepo.find and return at most limit items
      expect(productRepo.find).toHaveBeenCalled();
      expect(out.length).toBeLessThanOrEqual(2);
      // CheckDB: mocked - no DB touch beyond mocked repos
      // Rollback: mocked
    });
  });

  describe('getProductIdSet', () => {
    // TC-recommendation-005: getProductIdSet returns a Set from productRepo.find
    it('TC-recommendation-005 - builds set of product ids', async () => {
      // Arrange
      productRepo.find.mockResolvedValue([{ id: 5 }, { id: 6 }] as any);
      // Act
      const set = await (service as any).getProductIdSet();
      // Assert
      expect(set.has(5)).toBe(true);
      expect(set.has(6)).toBe(true);
    });
  });
});
