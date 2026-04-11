// TC-FE-ADMINDASH: Unit tests for AdminDashboard

// TC-FE-ADMINDASH-01: with token and admin role, shows revenue card and other stats
// TC-FE-ADMINDASH-02: without token, remains in loading state
// TC-FE-ADMINDASH-03: when APIs throw error, loading becomes false and cards show zero values

// Mock AdminLayout used by the component to simplify rendering
jest.mock('./AdminLayout', () => ({ default: ({ children }: any) => <div>{children}</div> }));

// Mock API modules
jest.mock('../../api/authApi', () => ({ getProfile: jest.fn() }));
jest.mock('../../api/productsApi', () => ({ getProducts: jest.fn() }));
jest.mock('../../api/admin/ordersApi', () => ({ getOrders: jest.fn() }));
jest.mock('../../api/admin/usersApi', () => ({ getUsers: jest.fn() }));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { getProfile } from '../../api/authApi';
import { getProducts } from '../../api/productsApi';
import { getOrders } from '../../api/admin/ordersApi';
import { getUsers } from '../../api/admin/usersApi';

describe('AdminDashboard', () => {
  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  it('// TC-FE-ADMINDASH-01 shows revenue card for admin and formatted revenue', async () => {
    // Arrange: set token and mock API responses
    localStorage.setItem('token', 'tok');
    (getProfile as jest.Mock).mockResolvedValue({ role: 'admin' });
    (getProducts as jest.Mock).mockResolvedValue({ total: 5 } as any);
    (getOrders as jest.Mock).mockResolvedValue({ data: [{ totalAmount: '1000' }], total: 1 } as any);
    (getUsers as jest.Mock).mockResolvedValue({ total: 2 } as any);

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

  it('// TC-FE-ADMINDASH-02 without token stays loading', async () => {
    // No token in localStorage
    localStorage.removeItem('token');
    render(<AdminDashboard />);
    // Because component returns early in loadStats when token missing, "Đang tải..." remains
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  it('// TC-FE-ADMINDASH-03 on API error, loading false and cards show zeros', async () => {
    localStorage.setItem('token', 'tok');
    (getProfile as jest.Mock).mockResolvedValue({ role: 'admin' });
    (getProducts as jest.Mock).mockRejectedValue(new Error('fail'));
    (getOrders as jest.Mock).mockResolvedValue({ data: [], total: 0 } as any);
    (getUsers as jest.Mock).mockResolvedValue({ total: 0 } as any);

    render(<AdminDashboard />);

    await waitFor(() => expect(getProducts).toHaveBeenCalled());

    // Loading must be false and component shows stat cards (zeros)
    expect(screen.queryByText('Đang tải...')).not.toBeInTheDocument();
    // Zero values present
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
