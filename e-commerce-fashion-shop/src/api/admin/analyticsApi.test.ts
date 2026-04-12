// TC-FE-ANALYTICS: Unit tests for analyticsApi

import { getRevenueStats, getBestSellingProducts, getProductSales, getRevenueByMonth } from './analyticsApi';

describe('analyticsApi', () => {
  const token = 'tok';
  afterEach(() => {
    vi.restoreAllMocks();
    delete (global as any).fetch;
  });

  // Test Case ID: TC-FE-ANALYTICS-01
  it('should fetch revenue stats with query params and return JSON', async () => {
    const mockData = { totalRevenue: 100, totalOrders: 2, averageOrderValue: 50, productsSold: 10 };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockData });

    const res = await getRevenueStats(token, { startDate: '2024-01-01' });

    expect((global.fetch as any).mock.calls[0][0]).toContain('/reports/overview?');
    expect((global.fetch as any).mock.calls[0][1]).toEqual(expect.objectContaining({ headers: { Authorization: `Bearer ${token}` } }));
    expect(res).toEqual(mockData);
  });

  // Test Case ID: TC-FE-ANALYTICS-02
  it('should throw when server returns non-ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => 'error occurred' });
    await expect(getRevenueStats(token)).rejects.toThrow('error occurred');
  });

  // Test Case ID: TC-FE-ANALYTICS-03
  it('should fetch best selling products and return array', async () => {
    const mockRows = [{ productId: 1, name: 'P', imageUrl: 'u', totalSold: 5, revenue: 200 }];
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockRows });

    const res = await getBestSellingProducts(token, { limit: 5 });
    expect((global.fetch as any).mock.calls[0][0]).toContain('/reports/best-sellers');
    expect(res).toEqual(mockRows);
  });

  // Test Case ID: TC-FE-ANALYTICS-04
  it('getRevenueByMonth should call revenue-by-month endpoint and return data', async () => {
    const mockData = [{ month: '2024-01', revenue: 100 }];
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockData });
    const res = await getRevenueByMonth(token, { startDate: '2024-01-01', endDate: '2024-01-31' });
    expect((global.fetch as any).mock.calls[0][0]).toContain('/reports/revenue-by-month');
    expect(res).toEqual(mockData);
  });

  // Test Case ID: TC-FE-ANALYTICS-05
  it('getProductSales should propagate error message text', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => JSON.stringify({ message: 'bad' }) });
    await expect(getProductSales(token)).rejects.toThrow('bad');
  });
});
