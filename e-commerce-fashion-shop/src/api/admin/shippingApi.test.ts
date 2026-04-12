// TC-FE-SHIPPING: Unit tests for shippingApi

import { getShippings, updateShipping } from './shippingApi';

describe('shippingApi', () => {
  const token = 'tok-s';
  afterEach(() => {
    vi.restoreAllMocks();
    delete (global as any).fetch;
  });

  // Test Case ID: TC-FE-SHIPPING-01
  it('should call shipping endpoint with query params and return paged data', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [], total: 0, page: 1, limit: 10 }) });
    const res = await getShippings(token, { page: 2, limit: 5, sort: 'id' });
    const called = (global.fetch as any).mock.calls[0][0];
    expect(called).toContain('/shipping?');
    expect(res.data).toBeDefined();
  });

  // Test Case ID: TC-FE-SHIPPING-02
  it('should PATCH updateShipping with JSON body and return updated', async () => {
    const payload = { id: 1, trackingNumber: 'TRK' };
    const returned = { id: 1, trackingNumber: 'TRK' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => returned });
    const res = await updateShipping(token, payload as any);
    const opts = (global.fetch as any).mock.calls[0][1];
    expect(opts.method).toBe('PATCH');
    expect(opts.headers.Authorization).toBe(`Bearer ${token}`);
    expect(opts.body).toBe(JSON.stringify(payload));
    expect(res).toEqual(returned);
  });
});
