// TC-FE-SHIPPING: Unit tests for shippingApi

// TC-FE-SHIPPING-01: getShippings builds query and returns list
// TC-FE-SHIPPING-02: updateShipping PATCH with correct body and headers

import { getShippings, updateShipping } from './shippingApi';

describe('shippingApi', () => {
  const token = 'tok-s';
  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it('// TC-FE-SHIPPING-01 should call shipping endpoint with query params', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [], total: 0, page: 1, limit: 10 }) });
    const res = await getShippings(token, { page: 2, limit: 5, sort: 'id' });
    const called = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(called).toContain('/shipping?');
    expect(res.data).toBeDefined();
  });

  it('// TC-FE-SHIPPING-02 should PATCH updateShipping with JSON body', async () => {
    const payload = { id: 1, trackingNumber: 'TRK' };
    const returned = { id: 1, trackingNumber: 'TRK' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => returned });
    const res = await updateShipping(token, payload as any);
    const opts = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(opts.method).toBe('PATCH');
    expect(opts.headers.Authorization).toBe(`Bearer ${token}`);
    expect(opts.body).toBe(JSON.stringify(payload));
    expect(res).toEqual(returned);
  });
});
