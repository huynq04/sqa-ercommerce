// TC-FE-ORDERS: Unit tests for ordersApi

// TC-FE-ORDERS-01: getOrders builds correct query and returns data
// TC-FE-ORDERS-02: getOrder returns single order
// TC-FE-ORDERS-03: updateOrder PATCH with JSON body
// TC-FE-ORDERS-04: getOrders error -> throws text

import { getOrders, getOrder, updateOrder } from './ordersApi';

describe('ordersApi', () => {
  const token = 'tok-o';
  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it('// TC-FE-ORDERS-01 should call orders endpoint with query params', async () => {
    const response = { data: [], total: 0, page: 1, limit: 10 };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => response });
    const res = await getOrders(token, { page: 2, limit: 5, sort: 'createdAt' });
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('/orders?');
    expect(calledUrl).toContain('page=2');
    expect(res).toEqual(response);
  });

  it('// TC-FE-ORDERS-02 should fetch single order by id', async () => {
    const order = { id: 7, totalAmount: '100' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => order });
    const res = await getOrder(token, 7);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/orders/7');
    expect(res).toEqual(order);
  });

  it('// TC-FE-ORDERS-03 should PATCH updateOrder with JSON body', async () => {
    const payload = { shipmentStatus: 'shipped' };
    const returned = { id: 8, ...payload };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => returned });
    const res = await updateOrder(token, 8, payload);
    const opts = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(opts.method).toBe('PATCH');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.body).toBe(JSON.stringify(payload));
    expect(res).toEqual(returned);
  });

  it('// TC-FE-ORDERS-04 should throw when server responds non-ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => 'nope' });
    await expect(getOrders(token)).rejects.toThrow('nope');
  });
});
