// TC-FE-CATEGORIES: Unit tests for categoriesApi

// TC-FE-CATEGORIES-01: createCategory success -> POST
// TC-FE-CATEGORIES-02: createCategory error -> throws parsed message
// TC-FE-CATEGORIES-03: updateCategory success -> PATCH
// TC-FE-CATEGORIES-04: deleteCategory success -> DELETE

import { createCategory, updateCategory, deleteCategory } from './categoriesApi';

describe('categoriesApi', () => {
  const token = 'tk';
  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it('// TC-FE-CATEGORIES-01 should POST createCategory and return created', async () => {
    const payload = { name: 'C', description: 'd', parentId: null };
    const ret = { id: 1, ...payload };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ret });
    const res = await createCategory(token, payload as any);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/categories/create');
    expect(res).toEqual(ret);
  });

  it('// TC-FE-CATEGORIES-02 should throw parsed message when server returns JSON error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => JSON.stringify({ message: 'err' }) });
    await expect(createCategory(token, {} as any)).rejects.toThrow('err');
  });

  it('// TC-FE-CATEGORIES-03 should PATCH updateCategory', async () => {
    const payload = { id: 2, name: 'Updated' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => payload });
    const res = await updateCategory(token, payload as any);
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('PATCH');
    expect(res).toEqual(payload);
  });

  it('// TC-FE-CATEGORIES-04 should DELETE category and return message', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'deleted' }) });
    const res = await deleteCategory(token, 3);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/categories/3');
    expect(res).toEqual({ message: 'deleted' });
  });
});
