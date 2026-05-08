import {
  buyNow,
  checkoutFromCart,
  getUserOrder,
  getUserOrders,
} from './ordersApi';

afterEach(() => {
  jest.resetAllMocks();
});

describe('ordersApi', () => {
  it('TC-FE-ORDER-001 - getUserOrders calls list endpoint without query params', async () => {
    const sample = { data: [], total: 0, page: 1, limit: 10 };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await getUserOrders('token-1');

    expect(result).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/orders', {
      headers: { Authorization: 'Bearer token-1' },
    });
  });

  it('TC-FE-ORDER-002 - getUserOrders builds query string for pagination/sort', async () => {
    const sample = { data: [{ id: 1 }], total: 1, page: 2, limit: 5 };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    await getUserOrders('token-2', { page: 2, limit: 5, sort: '-createdAt' });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/orders?page=2&limit=5&sort=-createdAt',
      { headers: { Authorization: 'Bearer token-2' } },
    );
  });

  it('TC-FE-ORDER-003 - getUserOrders throws parsed message string on non-ok', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ message: 'Danh sach loi' }),
    });

    await expect(getUserOrders('token-3')).rejects.toThrow('Danh sach loi');
  });

  it('TC-FE-ORDER-004 - getUserOrders throws joined array message on validation error', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ message: ['page invalid', 'limit invalid'] }),
    });

    await expect(getUserOrders('token-4')).rejects.toThrow('page invalid, limit invalid');
  });

  it('TC-FE-ORDER-005 - getUserOrder calls detail endpoint by id', async () => {
    const sample = { id: 100, items: [] };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await getUserOrder('token-5', 100);

    expect(result).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/orders/100', {
      headers: { Authorization: 'Bearer token-5' },
    });
  });

  it('TC-FE-ORDER-006 - getUserOrder throws plain-text fallback error', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => 'Order not found',
    });

    await expect(getUserOrder('token-6', 404)).rejects.toThrow('Order not found');
  });

  it('TC-FE-ORDER-007 - buyNow sends payload to buy-now endpoint', async () => {
    const payload = {
      variantId: 10,
      quantity: 2,
      paymentMethod: 'cod' as const,
      shippingAddress: 'HN',
      shippingFee: 30000,
    };
    const sample = { order: { id: 1 } };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await buyNow('token-7', payload);

    expect(result).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/orders/buy-now', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-7',
      },
      body: JSON.stringify(payload),
    });
  });

  it('TC-FE-ORDER-008 - buyNow throws parsed API error when request fails', async () => {
    const payload = {
      variantId: 10,
      quantity: 2,
      paymentMethod: 'cod' as const,
      shippingAddress: 'HN',
      shippingFee: 0,
    };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ error: 'Het hang' }),
    });

    await expect(buyNow('token-8', payload)).rejects.toThrow('Het hang');
  });

  it('TC-FE-ORDER-009 - checkoutFromCart sends payload to from-cart endpoint', async () => {
    const payload = {
      paymentMethod: 'vnpay' as const,
      shippingAddress: 'HCM',
      shippingFee: 40000,
      discountCode: 'SAVE10',
    };
    const sample = { order: { id: 2 }, payUrl: 'https://pay' };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await checkoutFromCart('token-9', payload);

    expect(result).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/orders/from-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-9',
      },
      body: JSON.stringify(payload),
    });
  });

  it('TC-FE-ORDER-010 - checkoutFromCart throws parsed error when non-ok response', async () => {
    const payload = {
      paymentMethod: 'cod' as const,
      shippingAddress: 'DN',
      shippingFee: 10000,
    };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ message: 'Cart rong' }),
    });

    await expect(checkoutFromCart('token-10', payload)).rejects.toThrow('Cart rong');
  });
});
