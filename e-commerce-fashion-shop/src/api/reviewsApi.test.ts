import { createReview, checkOrderItemReview, getProductReviews } from './reviewsApi';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('reviewsApi', () => {
  // TC-reviews-api-001: createReview posts payload and returns json
  it('TC-reviews-api-001 - createReview posts payload and returns response', async () => {
    // Arrange: mock successful review creation
    // CheckNetwork: expect POST /reviews with payload
    const payload = { orderItemId: 1, rating: 5, comment: 'ok' };
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, ...payload }) });

    // Act: call createReview
    const res = await createReview('tok', payload);

    // Assert: returns created item and sends POST
    // Rollback: reset mocks in afterEach
    expect(res).toHaveProperty('id', 1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reviews'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      }),
    );
  });

  // TC-reviews-api-002: checkOrderItemReview returns null on 404
  it('TC-reviews-api-002 - checkOrderItemReview returns null when 404', async () => {
    // Arrange: backend says review not found
    // CheckNetwork: authenticated check endpoint is called
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ status: 404 });

    // Act: call check endpoint
    const res = await checkOrderItemReview('tok', 123);

    // Assert: returns null on 404
    // Rollback: reset mocks in afterEach
    expect(res).toBeNull();
  });

  // TC-reviews-api-003: getProductReviews uses query params
  it('TC-reviews-api-003 - getProductReviews returns parsed data', async () => {
    // Arrange: mock paged review list response
    // CheckNetwork: include page, limit, q and auth header
    const sample = { data: [], total: 0, page: 1, limit: 10 };
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act: call list endpoint with query options
    const res = await getProductReviews(1, { page: 1, limit: 10, q: 'a' }, 'tok');

    // Assert: helper returns parsed list response
    // Rollback: reset mocks in afterEach
    expect(res).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reviews/product/1?page=1&limit=10&q=a'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    );
  });

  // TC-reviews-api-004: createReview throws when response not ok
  it('TC-reviews-api-004 - createReview throws on non-ok response', async () => {
    // Arrange: mock API failure on review creation
    // CheckNetwork: POST is attempted once
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => 'create failed' });

    // Act: call createReview
    // Assert: helper propagates server error text
    // Rollback: reset mocks in afterEach
    await expect(createReview('tok', { orderItemId: 1, rating: 5, comment: 'x' })).rejects.toThrow(/create failed/);
  });

  // TC-reviews-api-005: checkOrderItemReview returns review object on success
  it('TC-reviews-api-005 - checkOrderItemReview returns parsed review when exists', async () => {
    // Arrange: mock successful check response
    // CheckNetwork: endpoint includes order item id
    const sample = { id: 5, orderItemId: 123, productId: 8, rating: 4, comment: 'good' };
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => sample });

    // Act: call checkOrderItemReview
    const res = await checkOrderItemReview('tok', 123);

    // Assert: returns parsed review object
    // Rollback: reset mocks in afterEach
    expect(res).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reviews/order-items/123/check'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    );
  });

  // TC-reviews-api-006: getProductReviews throws on non-ok response
  it('TC-reviews-api-006 - getProductReviews throws backend error', async () => {
    // Arrange: mock failed reviews request
    // CheckNetwork: no silent fallback
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => 'reviews failed' });

    // Act: call getProductReviews
    // Assert: rejects with backend text
    // Rollback: reset mocks in afterEach
    await expect(getProductReviews(99, { page: 1, limit: 20, sort: '-createdAt' })).rejects.toThrow(/reviews failed/);
  });
});
