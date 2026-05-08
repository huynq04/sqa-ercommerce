// TC-FE-ORDERS: Unit tests for ordersApi

import { getOrders, getOrder, updateOrder } from './ordersApi';

describe('ordersApi', () => {
  const token = 'tok-o';
  afterEach(() => {
    vi.restoreAllMocks();
    delete (global as any).fetch;
  });

  // Test Case ID: TC-FE-ORDERS-01
  it('should call orders endpoint with query params and return paged response', async () => {
    const response = { data: [], total: 0, page: 1, limit: 10 };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => response });
    const res = await getOrders(token, { page: 2, limit: 5, sort: 'createdAt' });
    const calledUrl = (global.fetch as any).mock.calls[0][0] as string;
    expect(calledUrl).toContain('/orders?');
    expect(calledUrl).toContain('page=2');
    expect(res).toEqual(response);
  });

  // Test Case ID: TC-FE-ORDERS-02
  it('should fetch single order by id', async () => {
    const order = { id: 7, totalAmount: '100' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => order });
    const res = await getOrder(token, 7);
    expect((global.fetch as any).mock.calls[0][0]).toContain('/orders/7');
    expect(res).toEqual(order);
  });

  // Test Case ID: TC-FE-ORDERS-03
  it('should PATCH updateOrder with JSON body and return updated', async () => {
    const payload = { shipmentStatus: 'shipped' };
    const returned = { id: 8, ...payload };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => returned });
    const res = await updateOrder(token, 8, payload);
    const opts = (global.fetch as any).mock.calls[0][1];
    expect(opts.method).toBe('PATCH');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.body).toBe(JSON.stringify(payload));
    expect(res).toEqual(returned);
  });

  // Test Case ID: TC-FE-ORDERS-04
  it('should throw when server responds non-ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => 'nope' });
    await expect(getOrders(token)).rejects.toThrow('nope');
  });
});
