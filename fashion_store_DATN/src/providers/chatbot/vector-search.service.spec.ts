// TC-BE-VECTOR-SEARCH: Unit tests for VectorSearchService

import { VectorSearchService } from './vector-search.service';
import { BadRequestException } from '@nestjs/common';

// Minimal AiVector-like object for tests
const makeVector = (overrides: any) => ({
  id: overrides.id || 1,
  type: overrides.type || 'product',
  entityId: overrides.entityId || 1,
  content: overrides.content || 'c',
  vector: overrides.vector || [1, 0],
});

describe('VectorSearchService', () => {
  let service: VectorSearchService;
  let mockVectorRepo: any;
  let mockProductRepo: any;
  let mockPolicyRepo: any;
  let mockEmbedding: any;

  beforeEach(() => {
    mockVectorRepo = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn() };
    mockProductRepo = { findOne: jest.fn() };
    mockPolicyRepo = { findOne: jest.fn() };
    mockEmbedding = { generateEmbedding: jest.fn() };

    service = new VectorSearchService(
      mockVectorRepo as any,
      mockProductRepo as any,
      mockPolicyRepo as any,
      mockEmbedding as any,
    );
  });

  // TC-BE-VECTOR-01
  it('should return empty when no compatible vectors found (dimension mismatch)', async () => {
    mockEmbedding.generateEmbedding.mockResolvedValue([1, 2]);
    // all vectors dimension 3
    mockVectorRepo.find.mockResolvedValue([makeVector({ vector: [1, 2, 3] })]);

    const res = await service.search('q', 5, 0.1);
    expect(res).toEqual([]);
  });

  // TC-BE-VECTOR-02
  it('should return product search result with correct similarity', async () => {
    // Query vector [1,0]
    mockEmbedding.generateEmbedding.mockResolvedValue([1, 0]);
    // One vector identical => similarity ~1
    mockVectorRepo.find.mockResolvedValue([makeVector({ vector: [1, 0], entityId: 10 })]);
    mockProductRepo.findOne.mockResolvedValue({ id: 10, name: 'P10' });

    const res = await service.search('q', 5, 0.5);
    expect(res.length).toBe(1);
    expect(res[0].product).toBeDefined();
    expect(res[0].similarity).toBeCloseTo(1);
  });

  // TC-BE-VECTOR-03
  it('should return policies when type is policy', async () => {
    mockEmbedding.generateEmbedding.mockResolvedValue([1, 0]);
    mockVectorRepo.find.mockResolvedValue([makeVector({ type: 'policy', vector: [1, 0], entityId: 99 })]);
    mockPolicyRepo.findOne.mockResolvedValue({ id: 99, title: 'T' });

    const res = await service.search('q', 5, 0.5);
    expect(res.length).toBe(1);
    expect(res[0].policy).toBeDefined();
  });

  // TC-BE-VECTOR-04
  it('searchProducts should filter only products and respect limit', async () => {
    const mixed = [
      { product: { id: 1 }, similarity: 0.9 },
      { policy: { id: 2 }, similarity: 0.8 },
      { product: { id: 3 }, similarity: 0.7 },
    ];
    (service as any).search = jest.fn().mockResolvedValue(mixed);

    const res = await service.searchProducts('q', 1, 0);
    expect(res.length).toBe(1);
    expect(res[0].product.id).toBe(1);
  });

  // TC-BE-VECTOR-05
  it('upsertProductVector updates existing vector when found', async () => {
    const product = { id: 5, name: 'Prod', description: 'Desc' };
    mockEmbedding.generateEmbedding.mockResolvedValue([0.5, 0.5]);
    const existing = { id: 10, content: 'old', vector: [0, 0], type: 'product', entityId: 5 };
    mockVectorRepo.findOne.mockResolvedValue(existing);
    mockVectorRepo.save.mockResolvedValue({ ...existing, content: 'Prod Desc', vector: [0.5, 0.5] });

    const res = await service.upsertProductVector(product as any);
    expect(mockVectorRepo.findOne).toHaveBeenCalled();
    expect(mockVectorRepo.save).toHaveBeenCalled();
    expect(res.vector).toEqual([0.5, 0.5]);
  });

  // TC-BE-VECTOR-06
  it('upsertProductVector creates new vector when none exists', async () => {
    const product = { id: 6, name: 'NewProd', description: '' };
    mockEmbedding.generateEmbedding.mockResolvedValue([0.2, 0.3]);
    mockVectorRepo.findOne.mockResolvedValue(undefined);
    const created = { id: 20, type: 'product', entityId: 6, content: 'NewProd', vector: [0.2, 0.3] };
    mockVectorRepo.create.mockReturnValue(created);
    mockVectorRepo.save.mockResolvedValue(created);

    const res = await service.upsertProductVector(product as any);
    expect(mockVectorRepo.create).toHaveBeenCalled();
    expect(mockVectorRepo.save).toHaveBeenCalledWith(created);
    expect(res).toBe(created);
  });

  // TC-BE-VECTOR-07
  it('deleteVector should call repo.delete with correct params', async () => {
    await service.deleteVector('product' as any, 123);
    expect(mockVectorRepo.delete).toHaveBeenCalledWith({ type: 'product', entityId: 123 });
  });

  // TC-BE-VECTOR-08
  it('private cosineSimilarity handles zero norms and returns 0', () => {
    const res = (service as any).cosineSimilarity([0, 0], [0, 0]);
    expect(res).toBe(0);
  });

  // TC-BE-VECTOR-09
  it('should return empty when minSimilarity is greater than 1', async () => {
    await expect(service.search('q', 5, 2)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockEmbedding.generateEmbedding).not.toHaveBeenCalled();
    expect(mockVectorRepo.find).not.toHaveBeenCalled();
  });

  // TC-BE-VECTOR-10
  it('should process empty query due to missing validation', async () => {
    await expect(service.search('', 5, 0.5)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockEmbedding.generateEmbedding).not.toHaveBeenCalled();
    expect(mockVectorRepo.find).not.toHaveBeenCalled();
  });
});
