import { Repository } from 'typeorm';
import { VectorSearchService } from './vector-search.service';
import { EmbeddingService } from '@providers/chatbot/embedding.service';
import {
  AiVector,
  VectorType,
} from '@modules/ecommerce/entities/aiVector.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { PolicyDocument } from '@modules/ecommerce/entities/policyDocument.entity';

const makeVector = (overrides: Partial<AiVector>): AiVector => ({
  id: overrides.id ?? 1,
  type: overrides.type ?? VectorType.PRODUCT,
  entityId: overrides.entityId ?? 1,
  content: overrides.content ?? 'c',
  vector: overrides.vector ?? [1, 0],
} as AiVector);

describe('VectorSearchService', () => {
  let service: VectorSearchService;
  let vectorRepo: jest.Mocked<Repository<AiVector>>;
  let productRepo: jest.Mocked<Repository<Product>>;
  let policyRepo: jest.Mocked<Repository<PolicyDocument>>;
  let embeddingService: jest.Mocked<EmbeddingService>;

  beforeEach(() => {
    vectorRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<AiVector>>;
    productRepo = { findOne: jest.fn() } as unknown as jest.Mocked<
      Repository<Product>
    >;
    policyRepo = { findOne: jest.fn() } as unknown as jest.Mocked<
      Repository<PolicyDocument>
    >;
    embeddingService = {
      generateEmbedding: jest.fn(),
    } as unknown as jest.Mocked<EmbeddingService>;

    service = new VectorSearchService(
      vectorRepo,
      productRepo,
      policyRepo,
      embeddingService,
    );
  });

  // TC-BE-VECTOR-01: Tra rong khi dimension mismatch
  it('should return empty when no compatible vectors found', async () => {
    // Arrange
    embeddingService.generateEmbedding.mockResolvedValue([1, 2]);
    vectorRepo.find.mockResolvedValue([makeVector({ vector: [1, 2, 3] })]);

    // Act
    const result = await service.search('q', 5, 0.1);

    // Assert
    expect(result).toEqual([]);
  });

  // TC-BE-VECTOR-02: Tra ve product voi similarity dung
  it('should return product search result with correct similarity', async () => {
    // Arrange
    embeddingService.generateEmbedding.mockResolvedValue([1, 0]);
    vectorRepo.find.mockResolvedValue([
      makeVector({ vector: [1, 0], entityId: 10, type: VectorType.PRODUCT }),
    ]);
    productRepo.findOne.mockResolvedValue({ id: 10, name: 'P10' } as Product);

    // Act
    const result = await service.search('q', 5, 0.5);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].product).toBeDefined();
    expect(result[0].similarity).toBeCloseTo(1);
  });

  // TC-BE-VECTOR-03: Tra ve policy khi type=policy
  it('should return policies when type is policy', async () => {
    // Arrange
    embeddingService.generateEmbedding.mockResolvedValue([1, 0]);
    vectorRepo.find.mockResolvedValue([
      makeVector({ type: VectorType.POLICY, vector: [1, 0], entityId: 99 }),
    ]);
    policyRepo.findOne.mockResolvedValue({ id: 99, title: 'T' } as PolicyDocument);

    // Act
    const result = await service.search('q', 5, 0.5);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].policy).toBeDefined();
  });

  // TC-BE-VECTOR-04: Chi lay product va dung limit
  it('should filter only products and respect limit in searchProducts', async () => {
    // Arrange
    const mixed = [
      { product: { id: 1 } as Product, similarity: 0.9, content: 'p1' },
      { policy: { id: 2 } as PolicyDocument, similarity: 0.8, content: 'p2' },
      { product: { id: 3 } as Product, similarity: 0.7, content: 'p3' },
    ];
    jest.spyOn(service, 'search').mockResolvedValue(mixed);

    // Act
    const result = await service.searchProducts('q', 1, 0);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].product.id).toBe(1);
  });

  // TC-BE-VECTOR-05: Cap nhat vector khi ton tai
  it('should update existing vector in upsertProductVector', async () => {
    // Arrange
    const product = { id: 5, name: 'Prod', description: 'Desc' } as Product;
    embeddingService.generateEmbedding.mockResolvedValue([0.5, 0.5]);
    const existing = {
      id: 10,
      content: 'old',
      vector: [0, 0],
      type: VectorType.PRODUCT,
      entityId: 5,
    } as AiVector;
    vectorRepo.findOne.mockResolvedValue(existing);
    vectorRepo.save.mockResolvedValue({
      ...existing,
      content: 'Prod Desc',
      vector: [0.5, 0.5],
    } as AiVector);

    // Act
    const result = await service.upsertProductVector(product);

    // Assert
    expect(vectorRepo.findOne).toHaveBeenCalled();
    expect(vectorRepo.save).toHaveBeenCalled();
    expect(result.vector).toEqual([0.5, 0.5]);
  });

  // TC-BE-VECTOR-06: Tao vector moi khi chua ton tai
  it('should create new vector in upsertProductVector when none exists', async () => {
    // Arrange
    const product = { id: 6, name: 'NewProd', description: '' } as Product;
    embeddingService.generateEmbedding.mockResolvedValue([0.2, 0.3]);
    vectorRepo.findOne.mockResolvedValue(null);
    const created = {
      id: 20,
      type: VectorType.PRODUCT,
      entityId: 6,
      content: 'NewProd',
      vector: [0.2, 0.3],
    } as AiVector;
    vectorRepo.create.mockReturnValue(created);
    vectorRepo.save.mockResolvedValue(created);

    // Act
    const result = await service.upsertProductVector(product);

    // Assert
    expect(vectorRepo.create).toHaveBeenCalledWith({
      type: VectorType.PRODUCT,
      entityId: 6,
      content: 'NewProd',
      vector: [0.2, 0.3],
    });
    expect(vectorRepo.save).toHaveBeenCalledWith(created);
    expect(result).toBe(created);
  });

  // TC-BE-VECTOR-07: Goi repo.delete dung tham so
  it('should call repo.delete with correct params', async () => {
    // Arrange
    const type = VectorType.PRODUCT;

    // Act
    await service.deleteVector(type, 123);

    // Assert
    expect(vectorRepo.delete).toHaveBeenCalledWith({ type, entityId: 123 });
  });

  // TC-BE-VECTOR-08: Tra 0 khi norm=0
  it('should return 0 when cosineSimilarity has zero norms', () => {
    // Arrange
    const vecA = [0, 0];
    const vecB = [0, 0];

    // Act
    const result = (service as any).cosineSimilarity(vecA, vecB);

    // Assert
    expect(result).toBe(0);
  });

  // TC-BE-VECTOR-09: Tra rong khi minSimilarity > 1
  it('should return empty when minSimilarity is greater than 1', async () => {
    // Arrange
    embeddingService.generateEmbedding.mockResolvedValue([1, 0]);
    vectorRepo.find.mockResolvedValue([makeVector({ vector: [1, 0] })]);

    // Act
    const result = await service.search('q', 5, 2);

    // Assert
    expect(result).toEqual([]);
  });

  // TC-BE-VECTOR-10: Xu ly query rong theo logic hien tai
  it('should handle empty query without validation', async () => {
    // Arrange
    embeddingService.generateEmbedding.mockResolvedValue([1, 0]);
    vectorRepo.find.mockResolvedValue([]);

    // Act
    const result = await service.search('', 5, 0.5);

    // Assert
    expect(embeddingService.generateEmbedding).toHaveBeenCalledWith('');
    expect(result).toEqual([]);
  });
});
