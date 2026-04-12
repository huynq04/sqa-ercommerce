// TC-FE-ADMINDASH: Unit tests for AdminDashboard

// Mock AdminLayout used by the component to simplify rendering
vi.mock('./AdminLayout', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));

// Mock API modules
vi.mock('../../api/authApi', () => ({ getProfile: vi.fn() }));
vi.mock('../../api/productsApi', () => ({ getProducts: vi.fn() }));
vi.mock('../../api/admin/ordersApi', () => ({ getOrders: vi.fn() }));
vi.mock('../../api/admin/usersApi', () => ({ getUsers: vi.fn() }));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { getProfile } from '../../api/authApi';
import { getProducts } from '../../api/productsApi';
import { getOrders } from '../../api/admin/ordersApi';
import { getUsers } from '../../api/admin/usersApi';

describe('AdminDashboard', () => {
  afterEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  // Test Case ID: TC-FE-ADMINDASH-01
  it('shows revenue card for admin and formatted revenue', async () => {
    // Arrange: set token and mock API responses
    localStorage.setItem('token', 'tok');
    (getProfile as any).mockResolvedValue({ role: 'admin' });
    (getProducts as any).mockResolvedValue({ total: 5 } as any);
    (getOrders as any).mockResolvedValue({ data: [{ totalAmount: '1000' }], total: 1 } as any);
    (getUsers as any).mockResolvedValue({ total: 2 } as any);

    // Act
    render(<AdminDashboard />);

    // Assert: wait for APIs to be called and UI updated
    await waitFor(() => expect(getProducts).toHaveBeenCalled());

    // Revenue card should be present because user role is admin
    expect(screen.getByText('Doanh thu')).toBeInTheDocument();

    // Total revenue value should be formatted and include currency symbol
    expect(screen.getByText(/1,000/)).toBeInTheDocument();

    // Other stats should display correct totals
    expect(screen.getByText('Tổng sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Người dùng')).toBeInTheDocument();
  });

  // Test Case ID: TC-FE-ADMINDASH-02
  it('without token stays loading', async () => {
    // No token in localStorage
    localStorage.removeItem('token');
    render(<AdminDashboard />);
    // Because component returns early in loadStats when token missing, "Đang tải..." remains
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  // Test Case ID: TC-FE-ADMINDASH-03
  it('on API error, loading false and cards show zeros', async () => {
    localStorage.setItem('token', 'tok');
    (getProfile as any).mockResolvedValue({ role: 'admin' });
    (getProducts as any).mockRejectedValue(new Error('fail'));
    (getOrders as any).mockResolvedValue({ data: [], total: 0 } as any);
    (getUsers as any).mockResolvedValue({ total: 0 } as any);

    render(<AdminDashboard />);

    await waitFor(() => expect(getProducts).toHaveBeenCalled());

    // Loading must be false and component shows stat cards (zeros)
    expect(screen.queryByText('Đang tải...')).not.toBeInTheDocument();
    // Zero values present
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
