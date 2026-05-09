// admin-report.controller.spec.ts
// Unit tests for AdminReportController

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdminReportController } from './admin-report.controller';
import { AdminReportService } from '../services/admin-report.service';

const mockReportService = {
  getRevenueOverview: jest.fn(),
  getBestSellerProducts: jest.fn(),
  getProductSales: jest.fn(),
  getMonthlyRevenue: jest.fn(),
};

describe('AdminReportController', () => {
  let controller: AdminReportController;
  let service: typeof mockReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReportController],
      providers: [{ provide: AdminReportService, useValue: mockReportService }],
    }).compile();

    controller = module.get<AdminReportController>(AdminReportController);
    service = module.get(AdminReportService) as any;
    jest.clearAllMocks();
  });

  // TC-BE-REPORT-CTRL-01: getOverview (success)
  it('should return revenue overview', async () => {
    const expected = { totalRevenue: 100, totalOrders: 1 } as any;
    service.getRevenueOverview.mockResolvedValue(expected);
    const res = await controller.getOverview({} as any);
    expect(service.getRevenueOverview).toHaveBeenCalledWith({} as any);
    expect(res).toBe(expected);
  });

  // TC-BE-REPORT-CTRL-02: getBestSellers (success)
  it('should return best sellers', async () => {
    const expected = [] as any;
    service.getBestSellerProducts.mockResolvedValue(expected);
    const res = await controller.getBestSellers({} as any);
    expect(service.getBestSellerProducts).toHaveBeenCalledWith({} as any);
    expect(res).toBe(expected);
  });

  // TC-BE-REPORT-CTRL-03: getProductSales (success)
  it('should return product sales', async () => {
    const expected = [] as any;
    service.getProductSales.mockResolvedValue(expected);
    const res = await controller.getProductSales({} as any);
    expect(service.getProductSales).toHaveBeenCalledWith({} as any);
    expect(res).toBe(expected);
  });

  // TC-BE-REPORT-CTRL-04: getRevenueByMonth (success)
  it('should return monthly revenue', async () => {
    const expected = [{ month: '2024-01', revenue: 100 }];
    service.getMonthlyRevenue.mockResolvedValue(expected);
    const res = await controller.getRevenueByMonth({} as any);
    expect(service.getMonthlyRevenue).toHaveBeenCalledWith({} as any);
    expect(res).toBe(expected);
  });

  // TC-BE-REPORT-CTRL-05: service throws (error)
  it('should propagate service error', async () => {
    service.getRevenueOverview.mockRejectedValue(new Error('Service fail'));
    await expect(controller.getOverview({} as any)).rejects.toThrow('Service fail');
  });

  // TC-BE-REPORT-CTRL-06: filter undefined vẫn truyền vào service (negative)
  it('should pass undefined filter to getOverview', async () => {
    await expect(controller.getOverview(undefined as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(service.getRevenueOverview).not.toHaveBeenCalled();
  });

  // TC-BE-REPORT-CTRL-07: limit sai kiểu vẫn truyền vào service (negative)
  it('should pass invalid limit type to getBestSellers', async () => {
    const filter = { limit: 'abc' } as any;
    await expect(controller.getBestSellers(filter)).rejects.toThrow(
      BadRequestException,
    );
    expect(service.getBestSellerProducts).not.toHaveBeenCalled();
  });
});
