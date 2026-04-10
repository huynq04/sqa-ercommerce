import { getRecommendations } from './recommendationsApi';

afterEach(() => jest.resetAllMocks());

describe('recommendationsApi', () => {
  // TC-recommendations-api-001: returns empty if no token
  it('TC-recommendations-api-001 - returns empty array when no token', async () => {
    // Arrange
    (global as any).localStorage = { getItem: jest.fn().mockReturnValue(null) } as any;

    // Act
    const res = await getRecommendations(5);

    // Assert
    expect(res).toEqual([]);
  });

  // TC-recommendations-api-002: fetches when token exists
  it('TC-recommendations-api-002 - calls fetch when token present', async () => {
    // Arrange
    // Use window/localStorage provided by jsdom and set getItem on it
    const storage = { getItem: jest.fn().mockReturnValue('tok') };
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
    const data = [{ id: 1, name: 'P' }];
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(data) });

    // Act
    const res = await getRecommendations(3);

    // Assert
    expect(res).toEqual(data);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/recommendations?limit=3'), expect.any(Object));
  });
});
