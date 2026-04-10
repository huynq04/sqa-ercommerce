import { Injectable, HttpException, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { config } from '@config';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly axiosInstance: AxiosInstance;
  private readonly baseURL = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    this.apiKey = config.CHATBOT.API_KEY;
    this.model = 'models/gemini-embedding-001';

    if (!this.apiKey) {
      this.logger.warn(
        'Gemini API key not found. Embedding service will not work.',
      );
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        key: this.apiKey,
      },
    });
  }

  /**
   * Generate embedding vector for a text using Gemini Embedding API
   * @param text Text to embed
   * @returns Embedding vector (array of numbers)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new HttpException('Gemini API key not configured', 500);
    }

    try {
      // Normalize text
      const normalizedText = this.normalizeText(text);

      const response = await this.axiosInstance.post(
        `/${this.model}:embedContent`,
        {
          content: {
            parts: [
              {
                text: normalizedText,
              },
            ],
          },
        },
      );

      // Gemini returns embedding in response.data.embedding.values
      // Structure: { embedding: { values: number[] } }
      if (
        response.data?.embedding?.values &&
        Array.isArray(response.data.embedding.values)
      ) {
        return response.data.embedding.values;
      }

      // Fallback: try different response structure
      if (response.data?.embedding && Array.isArray(response.data.embedding)) {
        return response.data.embedding;
      }

      throw new Error('Invalid response format from Gemini API');
    } catch (error: any) {
      this.logger.error(
        `Error generating embedding: ${error.response?.data?.error?.message || error.message}`,
      );
      throw new HttpException(
        `Failed to generate embedding: ${error.response?.data?.error?.message || error.message}`,
        500,
      );
    }
  }

  /**
   * Generate embeddings for multiple texts
   * Note: Gemini API supports batch requests
   * @param texts Array of texts to embed
   * @returns Array of embedding vectors
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new HttpException('Gemini API key not configured', 500);
    }

    try {
      const normalizedTexts = texts.map((text) => this.normalizeText(text));

      // Gemini API supports batch requests
      const requests = normalizedTexts.map((text) => ({
        model: this.model,
        content: {
          parts: [
            {
              text: text,
            },
          ],
        },
      }));

      // For batch, we can use batchEmbedContents endpoint if available
      // Otherwise, process sequentially with rate limiting
      const embeddings: number[][] = [];

      for (const text of normalizedTexts) {
        try {
          const embedding = await this.generateEmbedding(text);
          embeddings.push(embedding);
          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error: any) {
          this.logger.error(
            `Error generating embedding for text: ${error.message}`,
          );
          // Continue with next text even if one fails
          embeddings.push([]);
        }
      }

      return embeddings.filter((emb) => emb.length > 0);
    } catch (error: any) {
      this.logger.error(
        `Error generating embeddings: ${error.response?.data?.error?.message || error.message}`,
      );
      throw new HttpException(
        `Failed to generate embeddings: ${error.response?.data?.error?.message || error.message}`,
        500,
      );
    }
  }

  /**
   * Normalize text for embedding
   * Remove extra whitespace, trim, etc.
   * Gemini supports up to 2048 tokens
   */
  private normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim().substring(0, 8000); // Safe limit (Gemini supports ~2048 tokens, ~8000 chars)
  }
}
