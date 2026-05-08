import { getRecommendations } from './recommendationsApi';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('recommendationsApi', () => {
  // TC-recommendations-api-001: returns empty if no token
  it('TC-recommendations-api-001 - returns empty array when no token', async () => {
    // Arrange: localStorage returns no token
    // CheckNetwork: fetch should not be called
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn().mockReturnValue(null) },
      configurable: true,
    });
    (globalThis as any).fetch = vi.fn();

    // Act: request recommendations
    const res = await getRecommendations(5);

    // Assert: returns empty list without network call
    // Rollback: reset mocks in afterEach
    expect(res).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  // TC-recommendations-api-002: fetches when token exists
  it('TC-recommendations-api-002 - calls fetch when token present', async () => {
    // Arrange: token exists and API returns recommendation list
    // CheckNetwork: verify limit query + Authorization header
    const storage = { getItem: vi.fn().mockReturnValue('tok') };
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
    const data = [{ id: 1, name: 'P' }];
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(data) });

    // Act: request recommendations with custom limit
    const res = await getRecommendations(3);

    // Assert: parsed data is returned with auth request
    // Rollback: reset mocks in afterEach
    expect(res).toEqual(data);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/recommendations?limit=3'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    );
  });

  // TC-recommendations-api-003: throws when backend returns non-ok
  it('TC-recommendations-api-003 - throws error when response is non-ok', async () => {
    // Arrange: token exists but backend responds with error
    // CheckNetwork: one authenticated request is attempted
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn().mockReturnValue('tok') },
      configurable: true,
    });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => 'unauthorized' });

    // Act: call recommendations API
    // Assert: helper propagates backend error
    // Rollback: reset mocks in afterEach
    await expect(getRecommendations()).rejects.toThrow(/unauthorized/);
  });

  // TC-recommendations-api-004: omits limit query when limit is 0
  it('TC-recommendations-api-004 - omits limit query when limit is zero', async () => {
    // Arrange: token exists and API returns empty list
    // CheckNetwork: request URL should not include ?limit=
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn().mockReturnValue('tok') },
      configurable: true,
    });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });

    // Act: call helper with 0 limit
    await getRecommendations(0);

    // Assert: endpoint is /recommendations without query
    // Rollback: reset mocks in afterEach
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/recommendations'),
      expect.any(Object),
    );
    expect((fetch as any).mock.calls[0][0]).not.toContain('?limit=');
  });

  // TC-recommendations-api-005: uses default limit when not provided
  it('TC-recommendations-api-005 - uses default limit when no limit provided', async () => {
    // Arrange
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn().mockReturnValue('tok') },
      configurable: true,
    });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });

    // Act
    await getRecommendations();

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/recommendations?limit=8'),
      expect.any(Object),
    );
  });

  // TC-recommendations-api-006: returns empty when token is empty string
  it('TC-recommendations-api-006 - returns empty array when token is empty string', async () => {
    // Arrange
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn().mockReturnValue('') },
      configurable: true,
    });
    (globalThis as any).fetch = vi.fn();

    // Act
    const res = await getRecommendations(5);

    // Assert
    expect(res).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
