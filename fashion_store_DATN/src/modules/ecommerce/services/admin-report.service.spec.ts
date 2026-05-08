// admin-report.service.spec.ts
// Unit tests for AdminReportService

import { AdminReportService } from './admin-report.service';

// Helper to create a chainable mock QueryBuilder
function createMockQB({ rawOneValue = undefined, rawManyValue = undefined } = {}) {
  const qb: any = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(rawOneValue),
    getRawMany: jest.fn().mockResolvedValue(rawManyValue),
    innerJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue('(subquery)'),
    getParameters: jest.fn().mockReturnValue({}),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
  };
  return qb;
}

const mockRepo = () => ({ createQueryBuilder: jest.fn() });

describe('AdminReportService', () => {
  let service: AdminReportService;
  let orderRepo: ReturnType<typeof mockRepo>;
  let orderItemRepo: ReturnType<typeof mockRepo>;
  let productRepo: ReturnType<typeof mockRepo>;

  beforeEach(() => {
    orderRepo = mockRepo();
    orderItemRepo = mockRepo();
    productRepo = mockRepo();
    service = new AdminReportService(
      orderRepo as any,
      orderItemRepo as any,
      productRepo as any,
    );
  });

  // TC-BE-REPORT-01: Lấy revenue overview (success)
  it('should return revenue overview with numeric conversions', async () => {
    const orderQb = createMockQB({ rawOneValue: { totalRevenue: '1000', totalOrders: '4' } });
    const orderItemQb = createMockQB({ rawOneValue: { productsSold: '20' } });

    orderRepo.createQueryBuilder.mockReturnValue(orderQb);
    orderItemRepo.createQueryBuilder.mockReturnValue(orderItemQb);

    const res = await service.getRevenueOverview({} as any);

    expect(orderRepo.createQueryBuilder).toHaveBeenCalledWith('order');
    expect(orderItemRepo.createQueryBuilder).toHaveBeenCalledWith('item');
    expect(res.totalRevenue).toBe(1000);
    expect(res.totalOrders).toBe(4);
    expect(res.averageOrderValue).toBeCloseTo(250);
    expect(res.productsSold).toBe(20);
  });

  // TC-BE-REPORT-02: applyDateFilters called when filter has dates (edge)
  it('should apply date filters when startDate and endDate provided', async () => {
    const orderQb = createMockQB({ rawOneValue: { totalRevenue: '0', totalOrders: '0' } });
    const itemQb = createMockQB({ rawOneValue: { productsSold: '0' } });
    orderRepo.createQueryBuilder.mockReturnValue(orderQb);
    orderItemRepo.createQueryBuilder.mockReturnValue(itemQb);

    const filter = { startDate: '2024-01-01', endDate: '2024-01-31' } as any;
    await service.getRevenueOverview(filter);

    // expect andWhere called for both startDate and endDate
    expect(orderQb.andWhere).toHaveBeenCalledWith('order.createdAt >= :startDate', expect.any(Object));
    expect(orderQb.andWhere).toHaveBeenCalledWith('order.createdAt <= :endDate', expect.any(Object));
  });

  // TC-BE-REPORT-03: getRevenueOverview propagates raw query error (error)
  it('should throw if underlying query fails', async () => {
    const badQb = createMockQB();
    badQb.getRawOne.mockRejectedValue(new Error('query fail'));
    orderRepo.createQueryBuilder.mockReturnValue(badQb);
    orderItemRepo.createQueryBuilder.mockReturnValue(createMockQB({ rawOneValue: { productsSold: '0' } }));
    await expect(service.getRevenueOverview({} as any)).rejects.toThrow('query fail');
  });

  // TC-BE-REPORT-04: getMonthlyRevenue returns continuous months between start and end
  it('should return revenue by month covering the date range', async () => {
    const rows = [
      { month: '2024-01', revenue: '100' },
      { month: '2024-03', revenue: '300' },
    ];
    const qb = createMockQB({ rawManyValue: rows });
    orderRepo.createQueryBuilder.mockReturnValue(qb);

    const res = await service.getMonthlyRevenue({ startDate: '2024-01-01', endDate: '2024-03-31' } as any);

    expect(Array.isArray(res)).toBe(true);
    // should cover Jan, Feb, Mar (3 entries)
    expect(res.length).toBe(3);
    expect(res[0]).toEqual({ month: '2024-01', revenue: 100 });
    expect(res[1]).toEqual({ month: '2024-02', revenue: 0 });
    expect(res[2]).toEqual({ month: '2024-03', revenue: 300 });
  });

  // TC-BE-REPORT-05: getBestSellerProducts maps string numbers to numbers (success)
  it('should return best sellers with numeric fields', async () => {
    const rows = [
      { productId: '1', name: 'P1', imageUrl: 'u1', totalSold: '5', revenue: '200' },
    ];
    const qb = createMockQB({ rawManyValue: rows });
    orderItemRepo.createQueryBuilder.mockReturnValue(qb);

    const res = await service.getBestSellerProducts({} as any);
    expect(res[0]).toEqual({ productId: 1, name: 'P1', imageUrl: 'u1', totalSold: 5, revenue: 200 });
  });

  // TC-BE-REPORT-06: getProductSales maps rows and handles subquery parameters (success)
  it('should return product sales with numeric conversions', async () => {
    const salesQb: any = createMockQB({});
    salesQb.getQuery = jest.fn().mockReturnValue('SELECT ...');
    salesQb.getParameters = jest.fn().mockReturnValue({ p: 1 });
    orderItemRepo.createQueryBuilder.mockReturnValue(salesQb);

    const productRows = [
      { productId: '2', name: 'Prod', imageUrl: 'img', totalSold: '7', revenue: '700' },
    ];
    const productQb: any = createMockQB({ rawManyValue: productRows });
    productRepo.createQueryBuilder.mockReturnValue(productQb);

    const res = await service.getProductSales({} as any);
    expect(productRepo.createQueryBuilder).toHaveBeenCalledWith('product');
    expect(res[0]).toEqual({ productId: 2, name: 'Prod', imageUrl: 'img', totalSold: 7, revenue: 700 });
  });
});
