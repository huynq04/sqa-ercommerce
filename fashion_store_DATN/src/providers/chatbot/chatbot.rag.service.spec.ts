// TC-BE-CHATBOT-RAG: Unit tests for ChatbotRagService

import { ChatbotRagService } from './chatbot.rag.service';

describe('ChatbotRagService', () => {
  let service: ChatbotRagService;
  let mockVectorSearch: any;

  beforeEach(() => {
    mockVectorSearch = { search: jest.fn() };
    service = new ChatbotRagService(mockVectorSearch as any);
  });

  // TC-BE-RAG-01
  it('should return fallback message when no results found', async () => {
    mockVectorSearch.search.mockResolvedValueOnce([]);
    const res = await service.getRelevantContext('query');
    expect(res).toBe('Không tìm thấy dữ liệu liên quan.');
  });

  // TC-BE-RAG-02
  it('should format product and policy contexts correctly (success case)', async () => {
    const results = [
      {
        product: { name: 'Shirt', description: 'Nice shirt', price: 250 },
        similarity: 0.93,
        content: 'product content',
      },
      {
        policy: { title: 'Return', content: 'Return within 7 days' },
        similarity: 0.75,
        content: 'policy content',
      },
    ];
    mockVectorSearch.search.mockResolvedValueOnce(results as any);

    const res = await service.getRelevantContext('mua áo');

    expect(res).toContain('Sản phẩm: Shirt');
    expect(res).toContain('Mô tả: Nice shirt');
    expect(res).toContain('Độ liên quan: 93.0%');
    expect(res).toContain('Chính sách: Return');
  });

  // TC-BE-RAG-03
  it('should return fallback when vector search throws (error case)', async () => {
    mockVectorSearch.search.mockRejectedValue(new Error('search fail'));
    const res = await service.getRelevantContext('x');
    expect(res).toBe('Không thể tìm kiếm dữ liệu lúc này.');
  });

  // TC-BE-RAG-04
  it('should return fallback when policy content is null (negative)', async () => {
    const results = [
      {
        policy: { title: 'Return', content: null },
        similarity: 0.8,
        content: 'policy content',
      },
    ];
    mockVectorSearch.search.mockResolvedValueOnce(results as any);

    const res = await service.getRelevantContext('policy');
    expect(res).toBe('Không thể tìm kiếm dữ liệu lúc này.');
  });
});
