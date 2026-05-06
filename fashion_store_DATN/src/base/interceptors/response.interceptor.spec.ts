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
  it('[TC_RESPONSE_INTERCEPTOR_001] ResponseInterceptor phải wrap dữ liệu trả về theo standard response format', async () => {
    const context = {} as ExecutionContext;

    const inputData = { id: 1, name: 'Item A' };

    const next: CallHandler = {
      handle: () => of(inputData),
    };

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result.success).toBe(true);
    expect(result.message).toBe('Success');
    expect(result.timestamp).toEqual(expect.any(String));
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    expect(result.data).toEqual(inputData);
  });

  // Test Case ID: TC_RESPONSE_INTERCEPTOR_002
  it('[TC_RESPONSE_INTERCEPTOR_002] ResponseInterceptor xử lý đúng trường hợp data null mà không gây lỗi', async () => {
    const context = {} as ExecutionContext;

    const next: CallHandler = {
      handle: () => of(null),
    };

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result.success).toBe(true);
    expect(result.message).toBe('Success');
    expect(result.timestamp).toEqual(expect.any(String));
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();

    expect(result.data).toBeNull();
  });

  // Test Case ID: TC_RESPONSE_INTERCEPTOR_003
  it('[TC_RESPONSE_INTERCEPTOR_003] ResponseInterceptor tạo timestamp theo Date.toISOString()', async () => {
    const fixedIso = '2026-04-10T10:00:00.000Z';

    const toISOStringSpy = jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue(fixedIso);

    const context = {} as ExecutionContext;

    const inputData = { ok: true };

    const next: CallHandler = {
      handle: () => of(inputData),
    };

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(toISOStringSpy).toHaveBeenCalledTimes(1);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Success');
    expect(result.timestamp).toBe(fixedIso);
    expect(result.data).toEqual(inputData);

    toISOStringSpy.mockRestore();
  });

  // Test Case ID: TC_RESPONSE_INTERCEPTOR_004
  it('[TC_RESPONSE_INTERCEPTOR_004] ResponseInterceptor không mutate payload gốc khi wrap vào response', async () => {
    const payload = { code: 'A01', price: 120000 };

    const context = {} as ExecutionContext;

    const next: CallHandler = {
      handle: () => of(payload),
    };

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result.success).toBe(true);
    expect(result.message).toBe('Success');
    expect(result.timestamp).toEqual(expect.any(String));
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();

    // CheckDB/State integrity (gian tiếp): đảm bảo không clone/mutate sai object
    expect(result.data).toBe(payload);
    expect(result.data).toEqual(payload);
  });
});
