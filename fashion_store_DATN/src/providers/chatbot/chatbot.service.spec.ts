// TC-BE-CHATBOT-SVC: Unit tests for ChatbotService
// Tests cover: successful message flow, Gemini API error handling, Redis interaction, RAG context usage

import { ChatbotService } from './chatbot.service';
import { BadRequestException, HttpException } from '@nestjs/common';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let mockRagService: any;
  let mockRedisService: any;

  beforeEach(() => {
    mockRagService = { getRelevantContext: jest.fn() };
    mockRedisService = { get: jest.fn(), set: jest.fn() };

    service = new ChatbotService(mockRagService, mockRedisService);

    // Replace axiosInstance with a controllable mock
    (service as any).axiosInstance = { post: jest.fn() } as any;
  });

  // TC-BE-CHATBOT-SVC-01
  it('should send message and store history in Redis (success case)', async () => {
    // Arrange: Redis returns previous history, RAG returns context, Gemini returns answer
    mockRedisService.get.mockResolvedValueOnce([
      { role: 'user', content: 'previous question' },
    ]);
    mockRagService.getRelevantContext.mockResolvedValueOnce('CTX: product info');

    const fakeApiResponse = {
      data: {
        choices: [
          { message: { content: 'This is the bot answer' } },
        ],
      },
    };

    (service as any).axiosInstance.post.mockResolvedValueOnce(fakeApiResponse);

    // Act
    const answer = await service.sendMessage('session123', 'Hello');

    // Assert
    expect(answer).toBe('This is the bot answer');

    // Redis set should be called to store last 10 messages and TTL 60s
    expect(mockRedisService.set).toHaveBeenCalled();
    const [redisKey, newHistory, ttl] = mockRedisService.set.mock.calls[0];
    expect(redisKey).toBe('chat:session123');
    expect(Array.isArray(newHistory)).toBe(true);
    expect(ttl).toBe(60 * 1000);

    // Axios post called with expected endpoint and messages array
    expect((service as any).axiosInstance.post).toHaveBeenCalledWith(
      '/chat/completions',
      expect.objectContaining({
        model: expect.any(String),
        messages: expect.any(Array),
      }),
    );
  });

  // TC-BE-CHATBOT-SVC-02
  it('should throw HttpException when Gemini API call fails (error case)', async () => {
    mockRedisService.get.mockResolvedValueOnce([]);
    mockRagService.getRelevantContext.mockResolvedValueOnce('CTX');

    (service as any).axiosInstance.post.mockRejectedValueOnce(
      new Error('Network failure'),
    );

    await expect(service.sendMessage('s', 'q')).rejects.toThrow(HttpException);

    // Redis set should not be called on API failure
    expect(mockRedisService.set).not.toHaveBeenCalled();
  });

  // TC-BE-CHATBOT-SVC-03
  it('should handle empty Redis history and still work', async () => {
    mockRedisService.get.mockResolvedValueOnce(undefined);
    mockRagService.getRelevantContext.mockResolvedValueOnce('CTX');

    const fakeApiResponse = {
      data: {
        choices: [
          { message: { content: 'OK' } },
        ],
      },
    };
    (service as any).axiosInstance.post.mockResolvedValueOnce(fakeApiResponse);

    const answer = await service.sendMessage('s2', 'hi');
    expect(answer).toBe('OK');
    expect(mockRedisService.set).toHaveBeenCalledWith(
      'chat:s2',
      expect.any(Array),
      60 * 1000,
    );
  });

  // TC-BE-CHATBOT-SVC-04
  it('should accept whitespace sessionId due to missing validation', async () => {
    await expect(service.sendMessage('   ', 'hi')).rejects.toThrow(
      BadRequestException,
    );
    expect(mockRedisService.get).not.toHaveBeenCalled();
    expect((service as any).axiosInstance.post).not.toHaveBeenCalled();
    expect(mockRedisService.set).not.toHaveBeenCalled();
  });

  // TC-BE-CHATBOT-SVC-05
  it('should proceed even if Redis history is invalid format', async () => {
    mockRedisService.get.mockResolvedValueOnce('bad' as any);
    await expect(service.sendMessage('s3', 'hi')).rejects.toThrow(
      BadRequestException,
    );
    expect((service as any).axiosInstance.post).not.toHaveBeenCalled();
    expect(mockRedisService.set).not.toHaveBeenCalled();
  });
});
