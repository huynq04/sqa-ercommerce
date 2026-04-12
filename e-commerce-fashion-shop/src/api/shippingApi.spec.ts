import {
  calculateShippingFee,
  cancelShippingOrder,
  createShippingOrder,
  fetchDistricts,
  fetchProvinces,
  fetchWards,
  getShippingOrder,
} from './shippingApi';

afterEach(() => {
  jest.resetAllMocks();
});

describe('shippingApi', () => {
  it('TC-FE-SHIPPING-001 - fetchProvinces returns data field when wrapped response is used', async () => {
    const sample = { data: [{ ProvinceID: 1, ProvinceName: 'Ha Noi' }] };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await fetchProvinces();

    expect(result).toEqual(sample.data);
  });

  it('TC-FE-SHIPPING-002 - fetchProvinces falls back to raw array payload', async () => {
    const sample = [{ ProvinceID: 2, ProvinceName: 'HCM' }];
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await fetchProvinces();

    expect(result).toEqual(sample);
  });

  it('TC-FE-SHIPPING-003 - fetchDistricts appends provinceId query parameter', async () => {
    const sample = { data: [{ DistrictID: 10, DistrictName: 'Quan 1', ProvinceID: 2 }] };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    await fetchDistricts(2);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/shipping/ghn/districts?provinceId=2',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('TC-FE-SHIPPING-004 - fetchWards appends districtId query parameter', async () => {
    const sample = { data: [{ WardCode: '001', WardName: 'Ben Nghe', DistrictID: 10 }] };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    await fetchWards(10);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/shipping/ghn/wards?districtId=10',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('TC-FE-SHIPPING-005 - calculateShippingFee posts payload to calculate-fee endpoint', async () => {
    const payload = { toDistrictId: 10, toWardCode: '001', weight: 1200 };
    const sample = { success: true, total: 25000 };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await calculateShippingFee(payload);

    expect(result).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/shipping/ghn/calculate-fee',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    );
  });

  it('TC-FE-SHIPPING-006 - getShippingOrder queries shipping order by code', async () => {
    const sample = { success: true, data: { order_code: 'GHN123' } };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await getShippingOrder('GHN123');

    expect(result).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/shipping/ghn/order/GHN123',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('TC-FE-SHIPPING-007 - createShippingOrder sends create-order request and returns order code', async () => {
    const payload = {
      orderId: 100,
      toName: 'A',
      toPhone: '0900000000',
      toAddress: 'Addr',
      toWardCode: '001',
      toDistrictId: 10,
    };
    const sample = { success: true, orderCode: 'GHN_NEW' };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await createShippingOrder(payload);

    expect(result).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/shipping/ghn/create-order',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
    );
  });

  it('TC-FE-SHIPPING-008 - cancelShippingOrder sends DELETE body with order code', async () => {
    const sample = { success: true, message: 'Cancelled' };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample });

    const result = await cancelShippingOrder('GHN_CANCEL_1');

    expect(result).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/shipping/ghn/cancel-order',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ orderCode: 'GHN_CANCEL_1' }),
      }),
    );
  });
});
