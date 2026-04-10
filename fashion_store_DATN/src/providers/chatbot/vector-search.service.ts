import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  AiVector,
  VectorType,
} from '@modules/ecommerce/entities/aiVector.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { PolicyDocument } from '@modules/ecommerce/entities/policyDocument.entity';
import { EmbeddingService } from '@providers/chatbot/embedding.service';

interface SearchResult {
  product?: Product;
  policy?: PolicyDocument;
  similarity: number;
  content: string;
}

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(
    @InjectRepository(AiVector)
    private readonly vectorRepo: Repository<AiVector>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(PolicyDocument)
    private readonly policyRepo: Repository<PolicyDocument>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Search for similar content using vector similarity
   * @param query User query text
   * @param limit Maximum number of results
   * @param minSimilarity Minimum similarity threshold (0-1)
   * @returns Array of search results with products/policies and similarity scores
   */
  async search(
    query: string,
    limit: number = 5,
    minSimilarity: number = 0.7,
  ): Promise<SearchResult[]> {
    try {
      // Generate embedding for query
      const queryVector = await this.embeddingService.generateEmbedding(query);
      const targetDim = queryVector.length;

      // Get all vectors from database
      const allVectors = await this.vectorRepo.find();
      const compatibleVectors = allVectors.filter(
        (v) => Array.isArray(v.vector) && v.vector.length === targetDim,
      );
      const skipped = allVectors.length - compatibleVectors.length;
      if (skipped > 0) {
        this.logger.warn(
          `Skipped ${skipped} vectors due to dimension mismatch (expected ${targetDim}).`,
        );
      }
      if (!compatibleVectors.length) {
        return [];
      }

      // Calculate cosine similarity for each vector
      const similarities: Array<{
        vector: AiVector;
        similarity: number;
      }> = compatibleVectors.map((vector) => {
        const similarity = this.cosineSimilarity(
          queryVector,
          vector.vector as number[],
        );
        return { vector, similarity };
      });

      // Filter by minimum similarity and sort by similarity (descending)
      const filteredResults = similarities
        .filter((item) => item.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      // Fetch full entities
      const results: SearchResult[] = await Promise.all(
        filteredResults.map(async (item) => {
          const { vector, similarity } = item;

          if (vector.type === VectorType.PRODUCT) {
            // Fetch full product with relations
            const product = await this.productRepo.findOne({
              where: { id: vector.entityId },
              relations: ['category', 'images'],
            });

            if (product) {
              return {
                product,
                similarity,
                content: vector.content,
              };
            }
          } else if (vector.type === VectorType.POLICY) {
            const policy = await this.policyRepo.findOne({
              where: { id: vector.entityId },
            });

            if (policy) {
              return {
                policy,
                similarity,
                content: vector.content,
              };
            }
          }

          return null;
        }),
      );

      return results.filter((r) => r !== null) as SearchResult[];
    } catch (error: any) {
      this.logger.error(`Error in vector search: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for products only
   */
  async searchProducts(
    query: string,
    limit: number = 5,
    minSimilarity: number = 0.7,
  ): Promise<Array<{ product: Product; similarity: number }>> {
    const results = await this.search(query, limit * 2, minSimilarity);
    return results
      .filter((r) => r.product)
      .slice(0, limit)
      .map((r) => ({
        product: r.product!,
        similarity: r.similarity,
      }));
  }

  /**
   * Search for policies only
   */
  async searchPolicies(
    query: string,
    limit: number = 5,
    minSimilarity: number = 0.7,
  ): Promise<Array<{ policy: PolicyDocument; similarity: number }>> {
    const results = await this.search(query, limit * 2, minSimilarity);
    return results
      .filter((r) => r.policy)
      .slice(0, limit)
      .map((r) => ({
        policy: r.policy!,
        similarity: r.similarity,
      }));
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param vecA First vector
   * @param vecB Second vector
   * @returns Similarity score (0-1)
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Create or update vector for a product
   */
  async upsertProductVector(product: Product): Promise<AiVector> {
    const content = `${product.name} ${product.description || ''}`.trim();
    const vector = await this.embeddingService.generateEmbedding(content);

    const existingVector = await this.vectorRepo.findOne({
      where: {
        type: VectorType.PRODUCT,
        entityId: product.id,
      },
    });

    if (existingVector) {
      existingVector.content = content;
      existingVector.vector = vector;
      return await this.vectorRepo.save(existingVector);
    }

    const newVector = this.vectorRepo.create({
      type: VectorType.PRODUCT,
      entityId: product.id,
      content,
      vector,
    });

    return await this.vectorRepo.save(newVector);
  }

  /**
   * Create or update vector for a policy
   */
  async upsertPolicyVector(policy: PolicyDocument): Promise<AiVector> {
    const content = `${policy.title} ${policy.content}`.trim();
    const vector = await this.embeddingService.generateEmbedding(content);

    const existingVector = await this.vectorRepo.findOne({
      where: {
        type: VectorType.POLICY,
        entityId: policy.id,
      },
    });

    if (existingVector) {
      existingVector.content = content;
      existingVector.vector = vector;
      return await this.vectorRepo.save(existingVector);
    }

    const newVector = this.vectorRepo.create({
      type: VectorType.POLICY,
      entityId: policy.id,
      content,
      vector,
    });

    return await this.vectorRepo.save(newVector);
  }

  /**
   * Delete vector for an entity
   */
  async deleteVector(type: VectorType, entityId: number): Promise<void> {
    await this.vectorRepo.delete({
      type,
      entityId,
    });
  }
}
