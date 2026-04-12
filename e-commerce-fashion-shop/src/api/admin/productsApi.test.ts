// TC-FE-PRODUCTS: Unit tests for productsApi

import { createProduct, updateProduct, deleteProduct } from './productsApi';

describe('productsApi', () => {
  const token = 't';
  afterEach(() => {
    vi.restoreAllMocks();
    delete (global as any).fetch;
  });

  // Test Case ID: TC-FE-PRODUCTS-01
  it('should POST createProduct with correct headers and body', async () => {
    const payload = { name: 'P', description: 'D', price: 100, discount: 0, categoryId: 1, mainImageUrl: 'u' };
    const returned = { id: 1, ...payload };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => returned });

    const res = await createProduct(token, payload as any);
    expect((global.fetch as any).mock.calls[0][0]).toContain('/products/create');
    const opts = (global.fetch as any).mock.calls[0][1];
    expect(opts.method).toBe('POST');
    expect(opts.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }));
    expect(opts.body).toBe(JSON.stringify(payload));
    expect(res).toEqual(returned);
  });

  // Test Case ID: TC-FE-PRODUCTS-02
  it('should throw parsed JSON error message on createProduct failure', async () => {
    const err = { message: 'Invalid payload' };
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => JSON.stringify(err) });
    await expect(createProduct(token, {} as any)).rejects.toThrow('Invalid payload');
  });

  // Test Case ID: TC-FE-PRODUCTS-03
  it('should PATCH updateProduct and return updated data', async () => {
    const payload = { id: 1, name: 'Updated' };
    const returned = { id: 1, name: 'Updated' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => returned });

    const res = await updateProduct(token, payload as any);
    expect((global.fetch as any).mock.calls[0][1].method).toBe('PATCH');
    expect(res).toEqual(returned);
  });

  // Test Case ID: TC-FE-PRODUCTS-04
  it('should DELETE product by id and return message', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'deleted' }) });
    const res = await deleteProduct(token, 5);
    expect((global.fetch as any).mock.calls[0][0]).toContain('/products/5');
    expect(res).toEqual({ message: 'deleted' });
  });

  // Test Case ID: TC-FE-PRODUCTS-05
  it('should throw when delete fails with JSON message', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => JSON.stringify({ message: 'not found' }) });
    await expect(deleteProduct(token, 999)).rejects.toThrow('not found');
  });
});
