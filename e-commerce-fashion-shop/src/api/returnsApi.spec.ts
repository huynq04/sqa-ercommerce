import { createReturnRequest, getUserReturnRequests } from './returnsApi';

afterEach(() => {
  jest.resetAllMocks();
});

describe('returnsApi', () => {
  it('TC-FE-RETURN-001 - getUserReturnRequests returns parsed list and sends auth header', async () => {
    const sample = [{ id: 1, orderItemId: 10, userId: 5, reason: 'defect', images: [], status: 'pending' }];
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await getUserReturnRequests('token-1');

    expect(result).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/user/requests/returns', {
      headers: {
        Authorization: 'Bearer token-1',
        'Content-Type': 'application/json',
      },
    });
  });

  it('TC-FE-RETURN-002 - getUserReturnRequests throws error text when response is non-ok', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => 'Unauthorized' });

    await expect(getUserReturnRequests('bad-token')).rejects.toThrow('Unauthorized');
  });

  it('TC-FE-RETURN-003 - createReturnRequest posts payload and returns parsed response', async () => {
    const payload = { orderItemId: 20, reason: 'wrong size', images: ['a.jpg'] };
    const sample = { id: 100, ...payload, status: 'pending' };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await createReturnRequest('token-3', payload);

    expect(result).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/user/requests/return', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-3',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  });

  it('TC-FE-RETURN-004 - createReturnRequest throws error text when API fails', async () => {
    const payload = { orderItemId: 21, reason: 'late', images: [] };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => 'Bad Request' });

    await expect(createReturnRequest('token-4', payload)).rejects.toThrow('Bad Request');
  });
});
