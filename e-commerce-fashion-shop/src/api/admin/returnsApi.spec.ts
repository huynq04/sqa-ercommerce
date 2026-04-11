// TC-FE-RETURNS: Unit tests for returnsApi

// TC-FE-RETURNS-01: getAdminReturns builds query and returns data
// TC-FE-RETURNS-02: getAdminReturnDetail fetches detail
// TC-FE-RETURNS-03: approveReturnRequest makes PATCH call
// TC-FE-RETURNS-04: rejectReturnRequest sends reason in body
// TC-FE-RETURNS-05: receiveCompleteReturn endpoints return data

import { getAdminReturns, getAdminReturnDetail, approveReturnRequest, rejectReturnRequest, receiveReturnRequest, completeReturnRequest } from './returnsApi';

describe('returnsApi', () => {
  const token = 'tkn';
  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it('// TC-FE-RETURNS-01 should call returns list with query params', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [], total: 0, page: 1, limit: 10 }) });
    const res = await getAdminReturns(token, { page: 1, limit: 5, q: 'x' });
    const called = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(called).toContain('/requests/returns');
    expect(called).toContain('q=x');
    expect(res.data).toBeDefined();
  });

  it('// TC-FE-RETURNS-02 should fetch return detail', async () => {
    const item = { id: 10 };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => item });
    const res = await getAdminReturnDetail(token, 10);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/requests/return/10');
    expect(res).toEqual(item);
  });

  it('// TC-FE-RETURNS-03 should approve return via PATCH', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'ok' }) });
    const res = await approveReturnRequest(token, 11);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/requests/return/11/approve');
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('PATCH');
    expect(res).toEqual({ message: 'ok' });
  });

  it('// TC-FE-RETURNS-04 should reject return with reason in body', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'rejected' }) });
    const res = await rejectReturnRequest(token, 12, 'bad');
    const opts = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(opts.method).toBe('PATCH');
    expect(opts.body).toBe(JSON.stringify({ reason: 'bad' }));
    expect(res).toEqual({ message: 'rejected' });
  });

  it('// TC-FE-RETURNS-05 should call receive and complete endpoints', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'ok' }) });
    await receiveReturnRequest(token, 13);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/requests/return/13/receive');
    await completeReturnRequest(token, 14);
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain('/requests/return/14/complete');
  });

  it('// TC-FE-RETURNS-06 should throw when server returns non-ok text', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => 'error' });
    await expect(getAdminReturns(token)).rejects.toThrow('error');
  });
});
