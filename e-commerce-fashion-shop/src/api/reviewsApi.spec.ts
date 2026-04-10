import { createReview, checkOrderItemReview, getProductReviews } from './reviewsApi';

afterEach(() => jest.resetAllMocks());

describe('reviewsApi', () => {
  // TC-reviews-api-001: createReview posts payload and returns json
  it('TC-reviews-api-001 - createReview posts payload and returns response', async () => {
    // Arrange
    const payload = { orderItemId: 1, rating: 5, comment: 'ok' };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, ...payload }) });

    // Act
    const res = await createReview('tok', payload);

    // Assert
    expect(res).toHaveProperty('id', 1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reviews'), expect.objectContaining({ method: 'POST' }));
  });

  // TC-reviews-api-002: checkOrderItemReview returns null on 404
  it('TC-reviews-api-002 - checkOrderItemReview returns null when 404', async () => {
    // Arrange
    (global as any).fetch = jest.fn().mockResolvedValue({ status: 404 });

    // Act
    const res = await checkOrderItemReview('tok', 123);

    // Assert
    expect(res).toBeNull();
  });

  // TC-reviews-api-003: getProductReviews uses query params
  it('TC-reviews-api-003 - getProductReviews returns parsed data', async () => {
    // Arrange
    const sample = { data: [], total: 0, page: 1, limit: 10 };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act
    const res = await getProductReviews(1, { page: 1, limit: 10, q: 'a' }, 'tok');

    // Assert
    expect(res).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reviews/product/1'), expect.any(Object));
  });
});
