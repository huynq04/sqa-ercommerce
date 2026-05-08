import { getCategories, getCategory } from './categoriesApi';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('categoriesApi', () => {
  // TC-categories-api-001: getCategories returns parsed data
  it('TC-categories-api-001 - getCategories returns parsed data', async () => {
    // Arrange: mock categories list response
    // CheckNetwork: expect page & limit query params
    const sample = { data: [{ id: 1, name: 'C' }], total: 1, page: 1, limit: 10 };
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act: call list helper
    const res = await getCategories({ page: 1, limit: 10 });

    // Assert: returns parsed payload and correct URL
    // Rollback: reset mocks in afterEach
    expect(res).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/categories?page=1&limit=10'));
  });

  // TC-categories-api-002: getCategory throws when not ok
  it('TC-categories-api-002 - getCategory throws on non-ok', async () => {
    // Arrange: mock failed detail response
    // CheckNetwork: no real network call
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => 'nope' });

    // Act: call detail helper
    // Assert: throws backend message
    // Rollback: reset mocks in afterEach
    await expect(getCategory(2)).rejects.toThrow(/nope/);
  });

  // TC-categories-api-003: getCategories includes sort query
  it('TC-categories-api-003 - getCategories appends sort query', async () => {
    // Arrange: mock successful list response
    // CheckNetwork: assert sort query key exists
    const sample = { data: [], total: 0, page: 3, limit: 5 };
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act: request categories with sort
    await getCategories({ page: 3, limit: 5, sort: 'id' });

    // Assert: URL contains page, limit and sort
    // Rollback: reset mocks in afterEach
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/categories?page=3&limit=5&sort=id'));
  });

  // TC-categories-api-004: getCategory returns parsed category on success
  it('TC-categories-api-004 - getCategory returns parsed data', async () => {
    // Arrange: mock category detail response
    // CheckNetwork: ensure endpoint contains category id
    const sample = { id: 9, name: 'Shoes' };
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act: call getCategory
    const res = await getCategory(9);

    // Assert: return value and URL are correct
    // Rollback: reset mocks in afterEach
    expect(res).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/categories/9'));
  });

  // TC-categories-api-005: getCategories throws on non-ok
  it('TC-categories-api-005 - getCategories throws on non-ok', async () => {
    // Arrange
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'bad request',
    });

    // Act + Assert
    await expect(getCategories()).rejects.toThrow(/bad request/);
  });

  // TC-categories-api-006: getCategories omits query when params not provided
  it('TC-categories-api-006 - getCategories calls base endpoint without query', async () => {
    // Arrange
    const sample = { data: [], total: 0, page: 1, limit: 10 };
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act
    await getCategories();

    // Assert
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/categories$/));
  });

  // TC-categories-api-007: getCategories ignores falsy page/limit
  it('TC-categories-api-007 - getCategories skips page/limit when zero', async () => {
    // Arrange
    const sample = { data: [], total: 0, page: 0, limit: 0 };
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => sample });

    // Act
    await getCategories({ page: 0, limit: 0, sort: 'name' });

    // Assert
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/categories?sort=name'));
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('page=0'));
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('limit=0'));
  });

  // TC-categories-api-008: getCategory throws backend error body
  it('TC-categories-api-008 - getCategory throws backend error body', async () => {
    // Arrange
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'not found',
    });

    // Act + Assert
    await expect(getCategory(999)).rejects.toThrow(/not found/);
  });
});
