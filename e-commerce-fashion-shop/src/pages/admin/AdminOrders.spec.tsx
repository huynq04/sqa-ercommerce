// TC-FE-ADMINORDERS: Unit tests for AdminOrders

// TC-FE-ADMINORDERS-01: with token loads orders and displays row and status badge
// TC-FE-ADMINORDERS-02: pagination buttons call loadData (page change)
// TC-FE-ADMINORDERS-03: without token stays loading

jest.mock('./AdminLayout', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
jest.mock('../../api/admin/ordersApi', () => ({ getOrders: jest.fn() }));

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminOrders from './AdminOrders';
import { getOrders } from '../../api/admin/ordersApi';

describe('AdminOrders', () => {
  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  it('// TC-FE-ADMINORDERS-01 should load orders and display status badge', async () => {
    localStorage.setItem('token', 't');
    const order = {
      id: 1,
      totalAmount: '1500',
      orderStatus: 'completed',
      paymentMethod: 'VNPAY',
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
      user: { id: 1, name: 'User1', email: 'u@x' },
    } as any;

    (getOrders as jest.Mock).mockResolvedValue({ data: [order], total: 20, page: 1, limit: 10 } as any);

    render(<AdminOrders />);

    await waitFor(() => expect(getOrders).toHaveBeenCalled());

    await screen.findByText('User1');
    // Status mapping for 'completed' is 'Hoàn thành'
    await screen.findByText('Hoàn thành');
  });

  it('// TC-FE-ADMINORDERS-02 clicking Next increments page and triggers load', async () => {
    localStorage.setItem('token', 't');
    (getOrders as jest.Mock).mockResolvedValue({ data: [], total: 50, page: 1, limit: 10 } as any);

    render(<AdminOrders />);
    await waitFor(() => expect(getOrders).toHaveBeenCalledTimes(1));

    const nextBtn = await screen.findByText('Sau');
    fireEvent.click(nextBtn);

    // Expect getOrders called again due to page change
    await waitFor(() => expect(getOrders).toHaveBeenCalledTimes(2));
  });

  it('// TC-FE-ADMINORDERS-03 no token remains loading', async () => {
    localStorage.removeItem('token');
    render(<AdminOrders />);
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });
});
