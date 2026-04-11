// TC-FE-ANALYTICS: Unit tests for analyticsApi

// TC-FE-ANALYTICS-01: getRevenueStats success -> calls correct URL and returns parsed JSON
// TC-FE-ANALYTICS-02: getRevenueStats error -> throws when response not ok
// TC-FE-ANALYTICS-03: getBestSellingProducts success -> calls best-sellers endpoint and returns array

import { getRevenueStats, getBestSellingProducts, getProductSales, getRevenueByMonth } from './analyticsApi';

describe('analyticsApi', () => {
  const token = 'tok';
  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it('// TC-FE-ANALYTICS-01 should fetch revenue stats with query params and return JSON', async () => {
    const mockData = { totalRevenue: 100, totalOrders: 2, averageOrderValue: 50, productsSold: 10 };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockData });

    const res = await getRevenueStats(token, { startDate: '2024-01-01' });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/reports/overview?');
    expect((global.fetch as jest.Mock).mock.calls[0][1]).toEqual(expect.objectContaining({ headers: { Authorization: `Bearer ${token}` } }));
    expect(res).toEqual(mockData);
  });

  it('// TC-FE-ANALYTICS-02 should throw when server returns non-ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => 'error occurred' });
    await expect(getRevenueStats(token)).rejects.toThrow('error occurred');
  });

  it('// TC-FE-ANALYTICS-03 should fetch best sellers and return array', async () => {
    const mockRows = [{ productId: 1, name: 'P', imageUrl: 'u', totalSold: 5, revenue: 200 }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockRows });

    const res = await getBestSellingProducts(token, { limit: 5 });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/reports/best-sellers');
    expect(res).toEqual(mockRows);
  });

  it('// TC-FE-ANALYTICS-04 getRevenueByMonth should call correct endpoint', async () => {
    const mockData = [{ month: '2024-01', revenue: 100 }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockData });
    const res = await getRevenueByMonth(token, { startDate: '2024-01-01', endDate: '2024-01-31' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/reports/revenue-by-month');
    expect(res).toEqual(mockData);
  });

  it('// TC-FE-ANALYTICS-05 getProductSales should propagate error message text', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => JSON.stringify({ message: 'bad' }) });
    await expect(getProductSales(token)).rejects.toThrow('bad');
  });
});
