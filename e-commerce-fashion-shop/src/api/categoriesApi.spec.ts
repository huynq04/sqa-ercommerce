import { getCategories, getCategory } from './categoriesApi';

afterEach(() => jest.resetAllMocks());

describe('categoriesApi', () => {
  // TC-categories-api-001: getCategories returns parsed data
  it('TC-categories-api-001 - getCategories returns parsed data', async () => {
    // Arrange
    const sample = { data: [{ id: 1, name: 'C' }], total: 1, page: 1, limit: 10 };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act
    const res = await getCategories({ page: 1, limit: 10 });

    // Assert
    expect(res).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/categories?page=1&limit=10'));
  });

  // TC-categories-api-002: getCategory throws when not ok
  it('TC-categories-api-002 - getCategory throws on non-ok', async () => {
    // Arrange
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => 'nope' });

    // Act & Assert
    await expect(getCategory(2)).rejects.toThrow(/nope/);
  });
});
