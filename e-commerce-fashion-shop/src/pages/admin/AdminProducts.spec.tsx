// TC-FE-ADMINPROD: Unit tests for AdminProducts

// TC-FE-ADMINPROD-01: no token -> navigate to /login
// TC-FE-ADMINPROD-02: loads products and categories and displays product row
// TC-FE-ADMINPROD-03: opening modal and uploading without file shows toast error
// TC-FE-ADMINPROD-04: submitting new product calls createProduct and shows success toast
// TC-FE-ADMINPROD-05: deleting a product confirms and calls deleteProduct

// Mock AdminLayout to simplify test
jest.mock('./AdminLayout', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));

// Mock APIs and utilities
jest.mock('../../api/categoriesApi', () => ({ getCategories: jest.fn() }));
jest.mock('../../api/admin/productsApi', () => ({ createProduct: jest.fn(), updateProduct: jest.fn(), deleteProduct: jest.fn() }));
jest.mock('../../api/uploadApi', () => ({ uploadFile: jest.fn() }));
jest.mock('../../api/productsApi', () => ({ getProducts: jest.fn() }));
jest.mock('../../utils/toast', () => ({ toast: jest.fn() }));

// Mock react-router hooks (preserve other exports like `Link`)
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/admin/products' };
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import AdminProducts from './AdminProducts';
import { getCategories } from '../../api/categoriesApi';
import { createProduct, deleteProduct } from '../../api/admin/productsApi';
import { getProducts } from '../../api/productsApi';
import { toast } from '../../utils/toast';
import { uploadFile } from '../../api/uploadApi';

describe('AdminProducts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  it('// TC-FE-ADMINPROD-01 should navigate to /login when no token', async () => {
    localStorage.removeItem('token');
    render(<AdminProducts />);
    // loadData will call navigate('/login') when token missing
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('// TC-FE-ADMINPROD-02 should load and display products', async () => {
    localStorage.setItem('token', 't');
    (getProducts as jest.Mock).mockResolvedValue({ data: [{ id: 1, name: 'P1', price: '100', discount: 0, stock: 5, mainImageUrl: '', categoryId: 1 }], total: 1 } as any);
    (getCategories as jest.Mock).mockResolvedValue({ data: [{ id: 1, name: 'Cat1' }], total: 1 } as any);

    render(<AdminProducts />);

    await waitFor(() => expect(getProducts).toHaveBeenCalled());

    await screen.findByText('P1');
    await screen.findByText(/100/);
  });

  it('// TC-FE-ADMINPROD-03 should show toast error when uploading without file', async () => {
    localStorage.setItem('token', 't');
    (getProducts as jest.Mock).mockResolvedValue({ data: [], total: 0 } as any);
    (getCategories as jest.Mock).mockResolvedValue({ data: [], total: 0 } as any);

    render(<AdminProducts />);
    await waitFor(() => expect(getProducts).toHaveBeenCalled());

    // Open modal
    fireEvent.click(screen.getByText('Thêm sản phẩm'));

    // Click upload without selecting file
    fireEvent.click(screen.getByText('Upload ảnh'));

    expect(toast).toHaveBeenCalledWith('Vui long chon anh truoc khi upload.', 'error');
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('// TC-FE-ADMINPROD-04 should call createProduct on submit and show success toast', async () => {
    localStorage.setItem('token', 'tok');
    (getProducts as jest.Mock).mockResolvedValue({ data: [], total: 0 } as any);
    (getCategories as jest.Mock).mockResolvedValue({ data: [{ id: 1, name: 'Cat1' }], total: 1 } as any);
    (createProduct as jest.Mock).mockResolvedValue({ id: 10 } as any);

    render(<AdminProducts />);
    await waitFor(() => expect(getProducts).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Thêm sản phẩm'));

    // Fill form inputs
    fireEvent.change(screen.getByPlaceholderText('Tên sản phẩm'), { target: { value: 'New' } });
    fireEvent.change(screen.getByPlaceholderText('Mô tả'), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByPlaceholderText('Giá'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Giảm giá (%)'), { target: { value: '5' } });
    fireEvent.change(screen.getByPlaceholderText('URL ảnh chính'), { target: { value: 'http://img' } });

    // Select category
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });

    // Submit by clicking the submit button
    const submitBtn = screen.queryByRole('button', { name: /tạo mới/i }) ||
      screen.queryByRole('button', { name: /create/i }) ||
      screen.getByRole('button');
    fireEvent.click(submitBtn);

    // Wait for createProduct to be called
    await waitFor(() => expect(createProduct).toHaveBeenCalled());
    expect(toast).toHaveBeenCalledWith('Thành công!');
  });

  it('// TC-FE-ADMINPROD-05 should delete product when confirmed', async () => {
    localStorage.setItem('token', 't');
    const product = { id: 2, name: 'DelMe', price: '100', discount: 0, stock: 1, mainImageUrl: '', categoryId: 1 };
    (getProducts as jest.Mock).mockResolvedValue({ data: [product], total: 1 } as any);
    (getCategories as jest.Mock).mockResolvedValue({ data: [], total: 0 } as any);
    (deleteProduct as jest.Mock).mockResolvedValue({ message: 'deleted' } as any);

    // Mock confirm to always return true
    jest.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<AdminProducts />);
    await waitFor(() => expect(getProducts).toHaveBeenCalled());

    // Find the row for product and click last button (delete)
    const row = screen.getByText('DelMe').closest('tr') as HTMLElement;
    const buttons = within(row).getAllByRole('button');
    const deleteBtn = buttons[buttons.length - 1];
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith('t', 2));
    expect(toast).toHaveBeenCalledWith('Đã xóa thành công!');
  });
});
