import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_RESPONSE_INTERCEPTOR_001
  it('bao goi du lieu tra ve theo format standard response', async () => {
    // Muc tieu: xac minh interceptor map response body sang format chuan.
    // Input: data object bat ky tu handler.
    // Ky vong: success=true, message=Success, co timestamp, data giu nguyen.
    const context = {} as ExecutionContext;
    const next: CallHandler = {
      handle: () => of({ id: 1, name: 'Item A' }),
    };

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result.success).toBe(true);
    expect(result.message).toBe('Success');
    expect(result.timestamp).toEqual(expect.any(String));
    expect(result.data).toEqual({ id: 1, name: 'Item A' });
  });

  // Test Case ID: TC_RESPONSE_INTERCEPTOR_002
  it('van bao goi du lieu null ma khong nem loi', async () => {
    // Muc tieu: dam bao interceptor hoat dong voi response null.
    // Input: handler tra ve null.
    // Ky vong: data trong response bang null.
    const context = {} as ExecutionContext;
    const next: CallHandler = {
      handle: () => of(null),
    };

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  // Test Case ID: TC_RESPONSE_INTERCEPTOR_003
  it('gan timestamp theo dinh dang ISO tu Date.toISOString', async () => {
    // Muc tieu: xac minh timestamp duoc sinh tu Date hien tai.
    // Input: mock Date.toISOString tra ve gia tri co dinh.
    // Ky vong: timestamp trong response trung gia tri mock.
    const fixedIso = '2026-04-10T10:00:00.000Z';
    const toISOStringSpy = jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue(fixedIso);

    const context = {} as ExecutionContext;
    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(toISOStringSpy).toHaveBeenCalledTimes(1);
    expect(result.timestamp).toBe(fixedIso);
  });

  // Test Case ID: TC_RESPONSE_INTERCEPTOR_004
  it('khong thay doi payload goc trong truong data', async () => {
    // Muc tieu: dam bao interceptor chi wrap payload, khong mutate object goc.
    // Input: payload object.
    // Ky vong: result.data tham chieu den dung object goc.
    const payload = { code: 'A01', price: 120000 };
    const context = {} as ExecutionContext;
    const next: CallHandler = {
      handle: () => of(payload),
    };

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result.data).toBe(payload);
    expect(result.data).toEqual({ code: 'A01', price: 120000 });
  });
});
