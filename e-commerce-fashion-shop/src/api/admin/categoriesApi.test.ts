// TC-FE-CATEGORIES: Unit tests for categoriesApi

import { createCategory, updateCategory, deleteCategory } from './categoriesApi';

describe('categoriesApi', () => {
  const token = 'tk';
  afterEach(() => {
    vi.restoreAllMocks();
    delete (global as any).fetch;
  });

  // Test Case ID: TC-FE-CATEGORIES-01
  it('should POST createCategory and return created category', async () => {
    const payload = { name: 'C', description: 'd', parentId: null };
    const ret = { id: 1, ...payload };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ret });
    const res = await createCategory(token, payload as any);
    expect((global.fetch as any).mock.calls[0][0]).toContain('/categories/create');
    expect(res).toEqual(ret);
  });

  // Test Case ID: TC-FE-CATEGORIES-02
  it('should throw parsed message when server returns JSON error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => JSON.stringify({ message: 'err' }) });
    await expect(createCategory(token, {} as any)).rejects.toThrow('err');
  });

  // Test Case ID: TC-FE-CATEGORIES-03
  it('should PATCH updateCategory and return updated', async () => {
    const payload = { id: 2, name: 'Updated' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    const res = await updateCategory(token, payload as any);
    expect((global.fetch as any).mock.calls[0][1].method).toBe('PATCH');
    expect(res).toEqual(payload);
  });

  // Test Case ID: TC-FE-CATEGORIES-04
  it('should DELETE category and return message', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'deleted' }) });
    const res = await deleteCategory(token, 3);
    expect((global.fetch as any).mock.calls[0][0]).toContain('/categories/3');
    expect(res).toEqual({ message: 'deleted' });
  });
});
