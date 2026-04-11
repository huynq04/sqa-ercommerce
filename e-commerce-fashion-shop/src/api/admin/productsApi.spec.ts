// TC-FE-PRODUCTS: Unit tests for productsApi

// TC-FE-PRODUCTS-01: createProduct success -> POST with JSON body and returns product
// TC-FE-PRODUCTS-02: createProduct error -> parses JSON error message when available
// TC-FE-PRODUCTS-03: updateProduct success -> PATCH with JSON body
// TC-FE-PRODUCTS-04: deleteProduct success -> DELETE to correct URL
// TC-FE-PRODUCTS-05: deleteProduct error -> throws parsed message

import { createProduct, updateProduct, deleteProduct } from './productsApi';

describe('productsApi', () => {
  const token = 't';
  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it('// TC-FE-PRODUCTS-01 should POST createProduct with correct headers and body', async () => {
    const payload = { name: 'P', description: 'D', price: 100, discount: 0, categoryId: 1, mainImageUrl: 'u' };
    const returned = { id: 1, ...payload };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => returned });

    const res = await createProduct(token, payload as any);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/products/create');
    const opts = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(opts.method).toBe('POST');
    expect(opts.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }));
    expect(opts.body).toBe(JSON.stringify(payload));
    expect(res).toEqual(returned);
  });

  it('// TC-FE-PRODUCTS-02 should throw parsed JSON error message on createProduct failure', async () => {
    const err = { message: 'Invalid payload' };
    global.fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => JSON.stringify(err) });
    await expect(createProduct(token, {} as any)).rejects.toThrow('Invalid payload');
  });

  it('// TC-FE-PRODUCTS-03 should PATCH updateProduct and return updated', async () => {
    const payload = { id: 1, name: 'Updated' };
    const returned = { id: 1, name: 'Updated' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => returned });

    const res = await updateProduct(token, payload as any);
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('PATCH');
    expect(res).toEqual(returned);
  });

  it('// TC-FE-PRODUCTS-04 should DELETE product by id', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'deleted' }) });
    const res = await deleteProduct(token, 5);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/products/5');
    expect(res).toEqual({ message: 'deleted' });
  });

  it('// TC-FE-PRODUCTS-05 should throw when delete fails with JSON message', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => JSON.stringify({ message: 'not found' }) });
    await expect(deleteProduct(token, 999)).rejects.toThrow('not found');
  });
});
