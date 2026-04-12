import { getProducts, getProduct } from './productsApi';

afterEach(() => {
  jest.resetAllMocks();
});

describe('productsApi', () => {
  // TC-products-api-001: getProducts returns parsed data
  it('TC-products-api-001 - getProducts returns parsed data', async () => {
    // Arrange: mock products list response
    // CheckNetwork: expect query page & limit
    const sample = { data: [{ id: 1, name: 'P' }], total: 1, page: 1, limit: 10 };
    (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act: call API helper
    const res = await getProducts({ page: 1, limit: 10 });

    // Assert: response equals parsed payload
    // Rollback: reset mocks in afterEach
    expect(res).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/products?page=1&limit=10'));
  });

  // TC-products-api-002: getProduct throws when response not ok
  it('TC-products-api-002 - getProduct throws on non-ok response', async () => {
    // Arrange: mock failed product detail response
    // CheckNetwork: no real network call
    (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => 'err' });

    // Act: call getProduct with id
    // Assert: throws backend error text
    // Rollback: reset mocks in afterEach
    await expect(getProduct(1)).rejects.toThrow(/err/);
  });

  // TC-products-api-003: getProducts appends sort query when provided
  it('TC-products-api-003 - getProducts appends sort query', async () => {
    // Arrange: mock successful list response
    // CheckNetwork: verify composed query string has sort
    const sample = { data: [], total: 0, page: 1, limit: 8 };
    (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act: request with page, limit and sort
    await getProducts({ page: 2, limit: 8, sort: '-createdAt' });

    // Assert: URL includes all expected query params
    // Rollback: reset mocks in afterEach
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/products?page=2&limit=8&sort=-createdAt'));
  });

  // TC-products-api-004: getProduct returns parsed object on success
  it('TC-products-api-004 - getProduct returns parsed product', async () => {
    // Arrange: mock successful product detail
    // CheckNetwork: verify endpoint contains product id
    const sample = { id: 7, name: 'P7' };
    (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act: fetch product detail
    const res = await getProduct(7);

    // Assert: helper returns parsed object and calls correct endpoint
    // Rollback: reset mocks in afterEach
    expect(res).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/products/7'));
  });
});
