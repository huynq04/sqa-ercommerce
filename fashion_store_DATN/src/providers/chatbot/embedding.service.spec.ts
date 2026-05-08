// TC-BE-EMBEDDING: Unit tests for EmbeddingService

import { EmbeddingService } from './embedding.service';
import { HttpException } from '@nestjs/common';

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    service = new EmbeddingService();
    // Ensure API key is present for tests
    (service as any).apiKey = 'TEST_API_KEY';
    // Replace axiosInstance with mock
    (service as any).axiosInstance = { post: jest.fn() } as any;
  });

  // TC-BE-EMBEDDING-01
  it('should return embedding from response.data.embedding.values', async () => {
    const fake = { data: { embedding: { values: [0.1, 0.2, 0.3] } } };
    (service as any).axiosInstance.post.mockResolvedValueOnce(fake);
    const emb = await service.generateEmbedding('hello world');
    expect(emb).toEqual([0.1, 0.2, 0.3]);
  });

  // TC-BE-EMBEDDING-02
  it('should fallback to response.data.embedding array', async () => {
    const fake = { data: { embedding: [1, 2, 3] } };
    (service as any).axiosInstance.post.mockResolvedValueOnce(fake);
    const emb = await service.generateEmbedding('abc');
    expect(emb).toEqual([1, 2, 3]);
  });

  // TC-BE-EMBEDDING-03
  it('should throw HttpException when API key missing', async () => {
    (service as any).apiKey = null;
    await expect(service.generateEmbedding('x')).rejects.toThrow(HttpException);
  });

  // TC-BE-EMBEDDING-04
  it('should throw HttpException when response format invalid', async () => {
    const fake = { data: {} };
    (service as any).axiosInstance.post.mockResolvedValueOnce(fake);
    await expect(service.generateEmbedding('h')).rejects.toThrow(HttpException);
  });

  // TC-BE-EMBEDDING-05
  it('should generate multiple embeddings and skip failures (generateEmbeddings)', async () => {
    // Mock generateEmbedding to succeed for first two and fail for third
    const genSpy = jest.spyOn(service as any, 'generateEmbedding');
    genSpy.mockImplementationOnce(async () => [1])
      .mockImplementationOnce(async () => [2])
      .mockImplementationOnce(async () => { throw new Error('fail'); });

    // Mock setTimeout to call immediately to avoid delays
    const realSetTimeout = (global as any).setTimeout;
    (global as any).setTimeout = (cb: any) => cb();

    const res = await service.generateEmbeddings(['a', 'b', 'c']);
    expect(res.length).toBe(2);

    // Restore setTimeout
    (global as any).setTimeout = realSetTimeout;
    genSpy.mockRestore();
  });
});
