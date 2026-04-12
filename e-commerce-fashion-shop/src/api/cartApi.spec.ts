import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from './cartApi';

afterEach(() => {
  jest.resetAllMocks();
});

describe('cartApi', () => {
  it('TC-FE-CART-001 - getCart calls endpoint with bearer token', async () => {
    const sample = { items: [] };
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => sample });

    const result = await getCart('token-1');

    expect(result).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/cart', {
      headers: { Authorization: 'Bearer token-1' },
    });
  });

  it('TC-FE-CART-002 - getCart returns parsed json payload', async () => {
    const sample = { id: 1, totalPrice: 120000 };
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => sample });

    await expect(getCart('token-2')).resolves.toEqual(sample);
  });

  it('TC-FE-CART-003 - addToCart sends POST with default quantity 1', async () => {
    const sample = { ok: true };
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => sample });

    await addToCart('token-3', 11);

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-3',
      },
      body: JSON.stringify({ variantId: 11, quantity: 1 }),
    });
  });

  it('TC-FE-CART-004 - addToCart sends provided quantity', async () => {
    const sample = { ok: true };
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => sample });

    await addToCart('token-4', 12, 4);

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-4',
      },
      body: JSON.stringify({ variantId: 12, quantity: 4 }),
    });
  });

  it('TC-FE-CART-005 - updateCartItem sends PATCH with quantity body', async () => {
    const sample = { ok: true };
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => sample });

    await updateCartItem('token-5', 99, 3);

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/cart/99', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-5',
      },
      body: JSON.stringify({ quantity: 3 }),
    });
  });

  it('TC-FE-CART-006 - removeCartItem sends DELETE with auth header', async () => {
    const sample = { message: 'removed' };
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => sample });

    await removeCartItem('token-6', 6);

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/cart/6', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer token-6' },
    });
  });

  it('TC-FE-CART-007 - clearCart sends DELETE to cart root endpoint', async () => {
    const sample = { message: 'cleared' };
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => sample });

    await clearCart('token-7');

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/cart', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer token-7' },
    });
  });

  it('TC-FE-CART-008 - addToCart propagates network errors', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('network error'));

    await expect(addToCart('token-8', 1, 1)).rejects.toThrow('network error');
  });
});
