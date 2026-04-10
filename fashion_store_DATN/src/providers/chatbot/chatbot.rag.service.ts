import { Injectable, Logger } from '@nestjs/common';
import { VectorSearchService } from '@providers/chatbot/vector-search.service';

@Injectable()
export class ChatbotRagService {
  private readonly logger = new Logger(ChatbotRagService.name);

  constructor(private readonly vectorSearchService: VectorSearchService) {}

  /**
   * Get relevant context using vector search (RAG)
   * @param query User query
   * @returns Context string for LLM
   */
  async getRelevantContext(query: string): Promise<string> {
    try {
      // Use vector search to find relevant products and policies
      const searchResults = await this.vectorSearchService.search(
        query,
        5, // limit
        0.6, // minSimilarity - lower threshold for better recall
      );

      if (searchResults.length === 0) {
        this.logger.warn(`No relevant context found for query: ${query}`);
        return 'Không tìm thấy dữ liệu liên quan.';
      }

      // Format context from search results
      const contexts: string[] = [];

      for (const result of searchResults) {
        if (result.product) {
          const product = result.product;
          contexts.push(
            `Sản phẩm: ${product.name}\nMô tả: ${product.description || 'N/A'}\nGiá: ${product.price}đ\nĐộ liên quan: ${(result.similarity * 100).toFixed(1)}%`,
          );
        } else if (result.policy) {
          const policy = result.policy;
          // Truncate policy content if too long
          const content =
            policy.content.length > 500
              ? policy.content.substring(0, 500) + '...'
              : policy.content;
          contexts.push(
            `Chính sách: ${policy.title}\nNội dung: ${content}\nĐộ liên quan: ${(result.similarity * 100).toFixed(1)}%`,
          );
        }
      }

      return contexts.join('\n\n');
    } catch (error: any) {
      this.logger.error(
        `Error getting relevant context: ${error.message}`,
        error.stack,
      );
      // Fallback to empty context if vector search fails
      return 'Không thể tìm kiếm dữ liệu lúc này.';
    }
  }
}
