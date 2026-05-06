// TC-FE-REVIEWS: Unit tests for reviewsApi

import { getAdminReviews, getAdminReview, replyReview } from './reviewsApi';

describe('reviewsApi', () => {
  const token = 't';
  afterEach(() => {
    vi.restoreAllMocks();
    delete (global as any).fetch;
  });

  // Test Case ID: TC-FE-REVIEWS-01
  it('should fetch reviews with optional productId query', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [], total: 0, page: 1, limit: 10 }) });
    const res = await getAdminReviews(token, { productId: 5 });
    expect((global.fetch as any).mock.calls[0][0]).toContain('productId=5');
    expect(res.data).toBeDefined();
  });

  // Test Case ID: TC-FE-REVIEWS-02
  it('should fetch a review by id', async () => {
    const review = { id: 3, comment: 'ok' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => review });
    const res = await getAdminReview(token, 3);
    expect((global.fetch as any).mock.calls[0][0]).toContain('/reviews/3');
    expect(res).toEqual(review);
  });

  // Test Case ID: TC-FE-REVIEWS-03
  it('should reply to review with PATCH body and return updated', async () => {
    const updated = { id: 3, sellerReply: 'thanks' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => updated });
    const res = await replyReview(token, 3, 'thanks');
    const opts = (global.fetch as any).mock.calls[0][1];
    expect(opts.method).toBe('PATCH');
    expect(opts.body).toBe(JSON.stringify({ reply: 'thanks' }));
    expect(res).toEqual(updated);
  });
});
