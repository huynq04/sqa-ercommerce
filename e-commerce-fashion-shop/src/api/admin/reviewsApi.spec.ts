// TC-FE-REVIEWS: Unit tests for reviewsApi

// TC-FE-REVIEWS-01: getAdminReviews builds query and returns response
// TC-FE-REVIEWS-02: getAdminReview returns single review
// TC-FE-REVIEWS-03: replyReview sends PATCH with reply body

import { getAdminReviews, getAdminReview, replyReview } from './reviewsApi';

describe('reviewsApi', () => {
  const token = 't';
  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it('// TC-FE-REVIEWS-01 should fetch reviews with optional productId', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [], total: 0, page: 1, limit: 10 }) });
    const res = await getAdminReviews(token, { productId: 5 });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('productId=5');
    expect(res.data).toBeDefined();
  });

  it('// TC-FE-REVIEWS-02 should fetch a review by id', async () => {
    const review = { id: 3, comment: 'ok' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => review });
    const res = await getAdminReview(token, 3);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/reviews/3');
    expect(res).toEqual(review);
  });

  it('// TC-FE-REVIEWS-03 should reply to review with PATCH body', async () => {
    const updated = { id: 3, sellerReply: 'thanks' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => updated });
    const res = await replyReview(token, 3, 'thanks');
    const opts = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(opts.method).toBe('PATCH');
    expect(opts.body).toBe(JSON.stringify({ reply: 'thanks' }));
    expect(res).toEqual(updated);
  });
});
