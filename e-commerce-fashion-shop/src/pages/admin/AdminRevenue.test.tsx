// TC-FE-ADMINREVENUE: Unit tests for AdminRevenue

vi.mock('./AdminLayout', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
vi.mock('../../api/admin/analyticsApi', () => ({ getRevenueStats: vi.fn(), getRevenueByMonth: vi.fn() }));

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminRevenue from './AdminRevenue';
import { getRevenueStats, getRevenueByMonth } from '../../api/admin/analyticsApi';

describe('AdminRevenue', () => {
  afterEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  // Test Case ID: TC-FE-ADMINREVENUE-01
  it('should display stats and render SVG chart', async () => {
    localStorage.setItem('token', 't');
    (getRevenueStats as any).mockResolvedValue({ totalRevenue: 1000, totalOrders: 2, averageOrderValue: 500, productsSold: 10 } as any);
    (getRevenueByMonth as any).mockResolvedValue([{ month: '2024-01', revenue: 100 }]);

    const { container } = render(<AdminRevenue />);

    await waitFor(() => expect(getRevenueStats).toHaveBeenCalled());

    expect(screen.getByText('Thống kê doanh thu')).toBeInTheDocument();
    // Assert that formatted totalRevenue appears (wait for async render)
    await screen.findByText(/1,000/);
    // SVG chart should be rendered
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  // Test Case ID: TC-FE-ADMINREVENUE-02
  it('clicking filter calls APIs with date params', async () => {
    localStorage.setItem('token', 't');
    (getRevenueStats as any).mockResolvedValue({ totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, productsSold: 0 } as any);
    (getRevenueByMonth as any).mockResolvedValue([] as any);

    const { container } = render(<AdminRevenue />);
    await waitFor(() => expect(getRevenueStats).toHaveBeenCalled());

    const dateInputs = container.querySelectorAll('input[type="date"]');
    const start = dateInputs[0] as HTMLInputElement;
    const end = dateInputs[1] as HTMLInputElement;

    fireEvent.change(start, { target: { value: '2024-01-01' } });
    fireEvent.change(end, { target: { value: '2024-01-31' } });

    fireEvent.click(screen.getByText('Lọc'));

    await waitFor(() => expect(getRevenueStats).toHaveBeenCalledWith('t', expect.objectContaining({ startDate: '2024-01-01', endDate: '2024-01-31' })));
  });

  // Test Case ID: TC-FE-ADMINREVENUE-03
  it('shows no-data message when API fails', async () => {
    localStorage.setItem('token', 't');
    (getRevenueStats as any).mockRejectedValue(new Error('fail'));
    (getRevenueByMonth as any).mockResolvedValue([] as any);

    render(<AdminRevenue />);

    await waitFor(() => expect(getRevenueStats).toHaveBeenCalled());

    // Monthly revenue section should show no data message
    expect(screen.getByText('Không có dữ liệu.')).toBeInTheDocument();
  });
});
