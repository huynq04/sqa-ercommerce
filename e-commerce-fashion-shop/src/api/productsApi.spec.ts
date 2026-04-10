import { getProducts, getProduct } from './productsApi';

afterEach(() => {
  jest.resetAllMocks();
});

describe('productsApi', () => {
  // TC-products-api-001: getProducts returns parsed data
  it('TC-products-api-001 - getProducts returns parsed data', async () => {
    // Arrange
    const sample = { data: [{ id: 1, name: 'P' }], total: 1, page: 1, limit: 10 };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act
    const res = await getProducts({ page: 1, limit: 10 });

    // Assert
    expect(res).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/products?page=1&limit=10'));
  });

  // TC-products-api-002: getProduct throws when response not ok
  it('TC-products-api-002 - getProduct throws on non-ok response', async () => {
    // Arrange
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => 'err' });

    // Act & Assert
    await expect(getProduct(1)).rejects.toThrow(/err/);
  });
});
