import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  forgotPassword,
  getProfile,
  login,
  register,
  resetPassword,
  verifyOtp,
} from './authApi';

describe('authApi', () => {
  const API_BASE = 'http://localhost:3000/api/v1';

  const originalFetch = globalThis.fetch;

  let fetchMock: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;

  beforeEach(() => {
    // Lam sach mock truoc moi test case.
    fetchMock = async () => {
      throw new Error('fetch mock is not configured for this test');
    };

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      return fetchMock(input, init);
    }) as typeof fetch;
  });

  afterEach(() => {
    // Rollback: khoi phuc fetch goc sau moi test case.
    globalThis.fetch = originalFetch;
  });

  // Test Case ID: TC_FE_AUTH_API_001
  it('login goi dung endpoint va tra access_token khi thanh cong', async () => {
    // Muc tieu: xac minh API login gui dung method/header/body va parse json.
    const payload = { email: 'user@example.com', password: '123456' };

    fetchMock = async (input, init) => {
      expect(String(input)).toBe(`${API_BASE}/auth/login`);
      expect(init?.method).toBe('POST');
      expect((init?.headers as Record<string, string>)['Content-Type']).toBe(
        'application/json',
      );
      expect(init?.body).toBe(JSON.stringify(payload));

      return {
        ok: true,
        status: 200,
        text: async () => '',
        json: async () => ({ access_token: 'jwt-token' }),
      } as Response;
    };

    const result = await login(payload);

    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  // Test Case ID: TC_FE_AUTH_API_002
  it('login throw error va gan status khi response khong ok', async () => {
    // Muc tieu: bao phu nhanh luong loi rieng cua login.
    fetchMock = async () => {
      return {
        ok: false,
        status: 401,
        text: async () => 'Invalid credentials',
        json: async () => ({}),
      } as Response;
    };

    await expect(login({ email: 'x@example.com', password: 'wrong' })).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    });
  });

  // Test Case ID: TC_FE_AUTH_API_003
  it('register goi dung endpoint va parse json khi thanh cong', async () => {
    const payload = {
      name: 'User A',
      email: 'a@example.com',
      password: '123456',
      phone: '0123456789',
      address: 'HN',
    };

    fetchMock = async (input, init) => {
      expect(String(input)).toBe(`${API_BASE}/auth/register`);
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(JSON.stringify(payload));

      return {
        ok: true,
        status: 201,
        text: async () => '',
        json: async () => ({ id: 1, ...payload }),
      } as Response;
    };

    const result = await register(payload);
    expect(result).toEqual({ id: 1, ...payload });
  });

  // Test Case ID: TC_FE_AUTH_API_004
  it('forgotPassword goi dung endpoint va body email', async () => {
    fetchMock = async (input, init) => {
      expect(String(input)).toBe(`${API_BASE}/auth/forgot-password`);
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(JSON.stringify({ email: 'a@example.com' }));

      return {
        ok: true,
        status: 200,
        text: async () => '',
        json: async () => ({ message: 'OTP sent' }),
      } as Response;
    };

    const result = await forgotPassword('a@example.com');
    expect(result).toEqual({ message: 'OTP sent' });
  });

  // Test Case ID: TC_FE_AUTH_API_005
  it('verifyOtp throw error khi response khong ok', async () => {
    fetchMock = async () => {
      return {
        ok: false,
        status: 400,
        text: async () => 'OTP invalid',
        json: async () => ({}),
      } as Response;
    };

    await expect(
      verifyOtp({ email: 'a@example.com', otp: '000000' }),
    ).rejects.toThrow('OTP invalid');
  });

  // Test Case ID: TC_FE_AUTH_API_006
  it('resetPassword goi dung endpoint va payload', async () => {
    const payload = {
      email: 'a@example.com',
      otp: '123456',
      newPassword: 'new-password',
    };

    fetchMock = async (input, init) => {
      expect(String(input)).toBe(`${API_BASE}/auth/reset-password`);
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(JSON.stringify(payload));

      return {
        ok: true,
        status: 200,
        text: async () => '',
        json: async () => ({ message: 'Reset success' }),
      } as Response;
    };

    const result = await resetPassword(payload);
    expect(result).toEqual({ message: 'Reset success' });
  });

  // Test Case ID: TC_FE_AUTH_API_007
  it('getProfile goi dung Authorization header Bearer token', async () => {
    fetchMock = async (input, init) => {
      expect(String(input)).toBe(`${API_BASE}/auth/profile`);
      expect((init?.headers as Record<string, string>).Authorization).toBe(
        'Bearer jwt-123',
      );

      return {
        ok: true,
        status: 200,
        text: async () => '',
        json: async () => ({
          sub: 1,
          email: 'user@example.com',
          role: 'user',
          iat: 1,
          exp: 2,
        }),
      } as Response;
    };

    const result = await getProfile('jwt-123');

    expect(result).toEqual({
      sub: 1,
      email: 'user@example.com',
      role: 'user',
      iat: 1,
      exp: 2,
    });
  });

  // Test Case ID: TC_FE_AUTH_API_008
  it('getProfile throw error khi profile endpoint response khong ok', async () => {
    fetchMock = async () => {
      return {
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
        json: async () => ({}),
      } as Response;
    };

    await expect(getProfile('bad-token')).rejects.toThrow('Forbidden');
  });
});
