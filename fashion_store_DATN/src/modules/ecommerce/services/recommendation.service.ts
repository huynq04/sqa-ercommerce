import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { AiRecommendationVector } from '@modules/ecommerce/entities/aiRecommendationVector.entity';
import { ActivityLog } from '@modules/ecommerce/entities/activityLog.entity';
import * as fs from 'fs';
import * as path from 'path';
import { RedisService } from '@base/db/redis/redis.service';

type OfflineModel = {
  similar_by_item?: Record<string, Array<{ id: number; score: number }>>;
  popular?: number[];
};

type CachedUserVector = {
  vector: number[];
  activityVersion: number;
  purchaseVersion: number;
};

@Injectable()
export class RecommendationService {
  // Dịch vụ gợi ý sản phẩm: kết hợp embedding online + model offline + fallback bán chạy.
  private readonly logger = new Logger(RecommendationService.name);
  private offlineModel?: OfflineModel;
  // Đường dẫn file offline model do training sinh ra.
  private artifactPath: string;
  private lastLoadedMtimeMs = 0;
  private productVectorsCache: {
    loadedAt: number;
    map: Map<number, number[]>;
  } = { loadedAt: 0, map: new Map() };

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(AiRecommendationVector)
    private readonly recVectorRepo: Repository<AiRecommendationVector>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
    private readonly redisService: RedisService,
  ) {
    // Đặt vị trí file recommendations.json để load khi khởi động.
    this.artifactPath = path.resolve(
      process.cwd(),
      '..',
      'training',
      'artifacts',
      'recommendations.json',
    );
    this.loadOfflineModel();
  }

  // Trả danh sách sản phẩm gợi ý cho user (limit mặc định 8).
  async getRecommendations(userId: number, limit = 8): Promise<Product[]> {
    this.reloadOfflineModelIfChanged();

    // Lấy lịch sử mua + danh mục đã mua để cá nhân hoá.
    const { purchasedProductIds, purchasedCategoryIds } =
      await this.getUserPurchasedProducts(userId);
    const purchasedSet = new Set(purchasedProductIds);
    const productIdsInDb = await this.getProductIdSet();
    let userHasBehavior = purchasedProductIds.length > 0;
    if (!userHasBehavior) {
      // Nếu chưa mua, kiểm tra thêm log xem sản phẩm (hành vi nhẹ).
      userHasBehavior = await this.hasUserProductActivity(userId);
    }

    let candidateIds: number[] = [];
    if (!userHasBehavior) {
      // User mới: ưu tiên gợi ý sản phẩm bán chạy.
      const popularIds = await this.getPopularProductIds(limit * 3);
      candidateIds = this.dedupe(popularIds).filter((id) =>
        productIdsInDb.has(id),
      );
    } else {
      // Online path: use product embeddings + user vector if available.
      const productVectors = await this.getProductVectors();
      if (productVectors.size) {
        const userVector = await this.getUserVector(
          userId,
          purchasedProductIds,
          productVectors,
        );
        if (userVector) {
          // Tính cosine similarity giữa user vector và product vector.
          const scored: Array<{ id: number; score: number }> = [];
          for (const [pid, vec] of productVectors.entries()) {
            if (purchasedSet.has(pid)) continue;
            if (!productIdsInDb.has(pid)) continue;
            const sim = this.cosineSimilarity(userVector, vec);
            scored.push({ id: pid, score: sim });
          }
          scored.sort((a, b) => b.score - a.score);
          candidateIds = scored.slice(0, limit * 3).map((x) => x.id);
        }
      }

      // Fallback to offline + popular if online empty.
      if (!candidateIds.length) {
        // Nếu không có embedding, fallback sang offline + bán chạy.
        const offlineIds = this.getOfflineCandidates(
          purchasedProductIds,
          limit * 2,
          productIdsInDb,
        );
        const popularIds = await this.getPopularProductIds(
          limit * 3,
          purchasedCategoryIds,
        );
        candidateIds = this.dedupe([...offlineIds, ...popularIds]).filter(
          (id) => {
            if (!productIdsInDb.has(id)) return false;
            return !purchasedSet.has(id);
          },
        );
      }
    }

    if (!candidateIds.length) {
      // Fallback cuối: chỉ trả top bán chạy.
      const fallback = await this.getPopularProductIds(limit * 3);
      candidateIds = this.dedupe(fallback).filter((id) => !purchasedSet.has(id));
    }

    if (!purchasedProductIds.length && userHasBehavior && candidateIds.length) {
      const preferredCategoryId = await this.getLatestViewedCategoryId(userId);
      candidateIds = await this.rerankByCategory(
        candidateIds,
        preferredCategoryId,
      );
    }

    const finalIds = candidateIds.slice(0, limit);
    if (!finalIds.length) return [];

    const products = await this.productRepo.find({
      where: { id: In(finalIds) },
      relations: [
        'category',
        'variants',
        'variants.color',
        'variants.size',
        'images',
      ],
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Giữ đúng thứ tự finalIds đã xếp hạng.
    return finalIds
      .map((id) => productMap.get(id))
      .filter((p): p is Product => Boolean(p));
  }

  // Load offline model từ file recommendations.json.
  private loadOfflineModel() {
    try {
      if (!fs.existsSync(this.artifactPath)) return;
      const stats = fs.statSync(this.artifactPath);
      this.lastLoadedMtimeMs = stats.mtimeMs;
      const raw = fs.readFileSync(this.artifactPath, 'utf8');
      this.offlineModel = JSON.parse(raw);
      this.logger.log(`Loaded offline recommendations from ${this.artifactPath}`);
    } catch (err) {
      this.logger.warn(`Could not load offline recommender: ${err.message}`);
    }
  }

  /**
   * Reload offline model if the artifact file has been updated by the trainer.
   */
  reloadOfflineModelIfChanged() {
    try {
      if (!fs.existsSync(this.artifactPath)) return;
      const stats = fs.statSync(this.artifactPath);
      if (stats.mtimeMs <= this.lastLoadedMtimeMs) return;
      this.loadOfflineModel();
    } catch (err) {
      this.logger.warn(`Failed to reload offline recommender: ${err.message}`);
    }
  }

  /**
   * Get or build user embedding from order history.
   * Cached in Redis for fast reuse.
   */
  private async getUserVector(
    userId: number,
    purchasedIds: number[],
    productVectors: Map<number, number[]>,
  ): Promise<number[] | null> {
    const cacheKey = `rec:uservec:${userId}`;
    const versions = await this.getUserVectorVersions(userId);
    // Lấy user vector từ Redis nếu vẫn hợp lệ theo phiên bản dữ liệu.
    const cached = await this.redisService.get<CachedUserVector>(cacheKey);
    if (
      cached?.vector?.length &&
      cached.activityVersion === versions.activityVersion &&
      cached.purchaseVersion === versions.purchaseVersion
    ) {
      return cached.vector;
    }

    const eventVectors = await this.getUserEventVectors(
      userId,
      purchasedIds,
      productVectors,
    );
    if (!eventVectors.length) return null;

    // Tính vector user = trung bình có trọng số giữa mua + xem.
    const dim = eventVectors[0].vector.length;
    const sum = new Array(dim).fill(0);
    let weightSum = 0;
    eventVectors.forEach(({ vector, weight }) => {
      weightSum += weight;
      for (let i = 0; i < dim; i++) sum[i] += vector[i] * weight;
    });
    if (!weightSum) return null;
    const mean = sum.map((x) => x / weightSum);

    // Cache 1 giờ để giảm tải tính toán.
    await this.redisService.set(
      cacheKey,
      {
        vector: mean,
        activityVersion: versions.activityVersion,
        purchaseVersion: versions.purchaseVersion,
      },
      60 * 60,
    ); // cache 1h
    return mean;
  }

  /**
   * Gather user event vectors from purchases + view logs and weight them.
   * Purchases weight = 1.0, views weight = 0.7 (configurable if needed).
   */
  private async getUserEventVectors(
    userId: number,
    purchasedIds: number[],
    productVectors: Map<number, number[]>,
  ): Promise<Array<{ vector: number[]; weight: number }>> {
    const results: Array<{ vector: number[]; weight: number }> = [];

    // Purchases (strong signal)
    purchasedIds.forEach((pid) => {
      const vec = productVectors.get(pid);
      if (vec) results.push({ vector: vec, weight: 1.0 });
    });

    // Views (weaker signal) - from activity_logs where entityType = 'product'
    const recentViews = await this.activityLogRepo.find({
      where: { user: { id: userId }, entityType: 'product' },
      order: { updatedAt: 'DESC' },
      take: 100, // limit to recent views
    });
    recentViews.forEach((log, idx) => {
      const vec = productVectors.get(log.entityId);
      if (!vec) return;
      // Small decay by recency position (optional)
      const decay = 0.9 ** idx;
      const count = Math.max(1, log.viewCount ?? 1);
      // View yếu hơn mua: 0.3 * log(viewCount) * decay.
      const weight = 0.7 * Math.log1p(count) * decay;
      results.push({ vector: vec, weight });
    });

    return results;
  }

  /**
   * Load product embeddings from ai_recommendation_vectors with a short-lived memory cache.
   */
  private async getProductVectors(): Promise<Map<number, number[]>> {
    const now = Date.now();
    if (now - this.productVectorsCache.loadedAt < 5 * 60 * 1000) {
      // Cache 5 phút để giảm truy vấn DB.
      return this.productVectorsCache.map;
    }

    const rows = await this.recVectorRepo.find();
    const map = new Map<number, number[]>();
    rows.forEach((r) => {
      if (Array.isArray(r.vector) && r.vector.length) {
        map.set(r.productId, r.vector as number[]);
      }
    });
    this.productVectorsCache = { loadedAt: now, map };
    return map;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    // Cosine = dot(a,b) / (||a||*||b||)
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    if (!denom) return 0;
    return dot / denom;
  }

  // Lấy danh sách sản phẩm đã mua để tránh gợi ý trùng.
  private async getUserPurchasedProducts(userId: number) {
    const items = await this.orderItemRepo.find({
      where: { order: { user: { id: userId } } },
      relations: ['order', 'variant', 'variant.product'],
    });

    const purchasedProductIds: number[] = [];
    const purchasedCategoryIds: number[] = [];

    items.forEach((item) => {
      const product = item.variant?.product;
      if (product) {
        purchasedProductIds.push(product.id);
        if (product.categoryId) {
          purchasedCategoryIds.push(product.categoryId);
        }
      }
    });

    return {
      purchasedProductIds: this.dedupe(purchasedProductIds),
      purchasedCategoryIds: this.dedupe(purchasedCategoryIds),
    };
  }

  private getOfflineCandidates(
    productIds: number[],
    limit: number,
    productIdsInDb: Set<number>,
  ): number[] {
    if (!this.offlineModel) return [];

    // Gom ứng viên từ offline model (similar_by_item).
    const scores = new Map<number, number>();

    if (this.offlineModel.similar_by_item) {
      for (const productId of productIds) {
        const candidates = this.offlineModel.similar_by_item[String(productId)];
        if (!candidates) continue;
        candidates.forEach((c) => {
          const current = scores.get(c.id) ?? 0;
          scores.set(c.id, Math.max(current, c.score));
        });
      }
    }

    const sortedCandidates = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    const filteredByInventory = sortedCandidates.filter((id) =>
      productIdsInDb.has(id),
    );
    if (filteredByInventory.length) {
      return filteredByInventory.slice(0, limit);
    }

    // Nếu offline không đủ, fallback sang danh sách popular trong file.
    if (this.offlineModel.popular?.length) {
      return this.offlineModel.popular
        .filter((id) => productIdsInDb.has(id))
        .slice(0, limit);
    }

    return [];
  }

  private async getPopularProductIds(
    limit: number,
    categoryIds?: number[],
  ): Promise<number[]> {
    // Tính top bán chạy theo order_items (SUM(quantity)).
    const qb = this.orderItemRepo
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.variant', 'variant')
      .leftJoin('variant.product', 'product')
      .select('product.id', 'productId')
      .addSelect('SUM(orderItem.quantity)', 'totalSold')
      .groupBy('product.id')
      .orderBy('totalSold', 'DESC')
      .limit(limit);

    if (categoryIds?.length) {
      qb.where('product.category_id IN (:...categoryIds)', { categoryIds });
    }

    const rows = await qb.getRawMany();
    const popular = rows
      .map((r) => Number(r.productId))
      .filter((id) => Number.isFinite(id));

    if (popular.length) return popular;

    // Fallback: if there is no order history yet, surface any products.
    const fallbackProducts = await this.productRepo.find({
      select: ['id'],
      take: limit,
      order: { id: 'DESC' },
    });
    return fallbackProducts.map((p) => p.id);
  }

  // Loại bỏ trùng ID.
  private dedupe(ids: number[]): number[] {
    const seen = new Set<number>();
    return ids.filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  private async getProductIdSet(): Promise<Set<number>> {
    // Reload every call so newly imported products are recognized.
    const products = await this.productRepo.find({ select: ['id'] });
    return new Set(products.map((p) => p.id));
  }

  private async rerankByCategory(
    candidateIds: number[],
    preferredCategoryId: number | null,
  ): Promise<number[]> {
    if (!preferredCategoryId) return candidateIds;
    const rows = await this.productRepo.find({
      select: ['id', 'categoryId'],
      where: { id: In(candidateIds) },
    });
    const categoryMap = new Map(rows.map((p) => [p.id, p.categoryId]));
    const preferred: number[] = [];
    const rest: number[] = [];
    candidateIds.forEach((id) => {
      const catId = categoryMap.get(id);
      if (catId === preferredCategoryId) {
        preferred.push(id);
      } else {
        rest.push(id);
      }
    });
    return [...preferred, ...rest];
  }

  private async getLatestViewedCategoryId(
    userId: number,
  ): Promise<number | null> {
    const latestView = await this.activityLogRepo.findOne({
      where: { user: { id: userId }, entityType: 'product' },
      select: ['id', 'entityId', 'updatedAt'],
      order: { updatedAt: 'DESC' },
    });
    if (!latestView?.entityId) return null;
    const product = await this.productRepo.findOne({
      where: { id: latestView.entityId },
      select: ['id', 'categoryId'],
    });
    return product?.categoryId ?? null;
  }

  // Kiểm tra user có lịch sử xem sản phẩm hay chưa.
  private async hasUserProductActivity(userId: number): Promise<boolean> {
    const latestActivity = await this.activityLogRepo.findOne({
      where: { user: { id: userId }, entityType: 'product' },
      select: ['id', 'updatedAt'],
      order: { updatedAt: 'DESC' },
    });
    return Boolean(latestActivity);
  }

  private async getUserVectorVersions(userId: number): Promise<{
    activityVersion: number;
    purchaseVersion: number;
  }> {
    // Lấy "version" để biết khi nào cần rebuild user vector.
    const [latestView, latestPurchase] = await Promise.all([
      this.activityLogRepo.findOne({
        where: { user: { id: userId }, entityType: 'product' },
        order: { updatedAt: 'DESC' },
        select: ['id', 'updatedAt'],
      }),
      this.orderItemRepo.findOne({
        where: { order: { user: { id: userId } } },
        order: { updatedAt: 'DESC' },
        select: ['id', 'updatedAt'],
      }),
    ]);

    return {
      activityVersion: latestView?.updatedAt
        ? latestView.updatedAt.getTime()
        : 0,
      purchaseVersion: latestPurchase?.updatedAt
        ? latestPurchase.updatedAt.getTime()
        : 0,
    };
  }
}
