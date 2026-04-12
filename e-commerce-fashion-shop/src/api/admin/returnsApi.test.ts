// TC-FE-RETURNS: Unit tests for returnsApi

import { getAdminReturns, getAdminReturnDetail, approveReturnRequest, rejectReturnRequest, receiveReturnRequest, completeReturnRequest } from './returnsApi';

describe('returnsApi', () => {
  const token = 'tkn';
  afterEach(() => {
    vi.restoreAllMocks();
    delete (global as any).fetch;
  });

  // Test Case ID: TC-FE-RETURNS-01
  it('should call returns list with query params and return paged data', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [], total: 0, page: 1, limit: 10 }) });
    const res = await getAdminReturns(token, { page: 1, limit: 5, q: 'x' });
    const called = (global.fetch as any).mock.calls[0][0] as string;
    expect(called).toContain('/requests/returns');
    expect(called).toContain('q=x');
    expect(res.data).toBeDefined();
  });

  // Test Case ID: TC-FE-RETURNS-02
  it('should fetch return detail by id', async () => {
    const item = { id: 10 };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => item });
    const res = await getAdminReturnDetail(token, 10);
    expect((global.fetch as any).mock.calls[0][0]).toContain('/requests/return/10');
    expect(res).toEqual(item);
  });

  // Test Case ID: TC-FE-RETURNS-03
  it('should approve return via PATCH and return message', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'ok' }) });
    const res = await approveReturnRequest(token, 11);
    expect((global.fetch as any).mock.calls[0][0]).toContain('/requests/return/11/approve');
    expect((global.fetch as any).mock.calls[0][1].method).toBe('PATCH');
    expect(res).toEqual({ message: 'ok' });
  });

  // Test Case ID: TC-FE-RETURNS-04
  it('should reject return with reason in body and return message', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'rejected' }) });
    const res = await rejectReturnRequest(token, 12, 'bad');
    const opts = (global.fetch as any).mock.calls[0][1];
    expect(opts.method).toBe('PATCH');
    expect(opts.body).toBe(JSON.stringify({ reason: 'bad' }));
    expect(res).toEqual({ message: 'rejected' });
  });

  // Test Case ID: TC-FE-RETURNS-05
  it('should call receive and complete endpoints for return requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'ok' }) });
    await receiveReturnRequest(token, 13);
    expect((global.fetch as any).mock.calls[0][0]).toContain('/requests/return/13/receive');
    await completeReturnRequest(token, 14);
    expect((global.fetch as any).mock.calls[1][0]).toContain('/requests/return/14/complete');
  });

  // Test Case ID: TC-FE-RETURNS-06
  it('should throw when server returns non-ok text', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => 'error' });
    await expect(getAdminReturns(token)).rejects.toThrow('error');
  });
});
