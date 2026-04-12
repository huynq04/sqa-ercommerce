import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

const mockGetProductReviews = vi.fn();
vi.mock('../api/reviewsApi', () => ({
  getProductReviews: (...args: any[]) => mockGetProductReviews(...args),
}));

import ProductDetail from './ProductDetail';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={["/product/1"]}>
    <Routes>
      <Route path="/product/:id" element={children} />
    </Routes>
  </MemoryRouter>
);

describe('ProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProductReviews.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn().mockReturnValue('tok') },
      configurable: true,
    });
  });

  // TC-product-detail-001: loads and shows product detail successfully
  it('TC-product-detail-001 - shows product after fetch', async () => {
    // Arrange: mock product endpoint and empty reviews
    // CheckNetwork: product detail endpoint called with route id
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'P',
        description: 'desc',
        price: '1000',
        discount: '0.00',
        stock: 5,
        categoryId: 1,
        category: { id: 1, name: 'Cat' },
        mainImageUrl: '/main.png',
        images: [],
        variants: [],
      }),
    });

    // Act: render product detail page
    render(<ProductDetail />, { wrapper: Wrapper });

    // Assert: heading and reviews empty state are shown
    // Rollback: mocks are reset in beforeEach
    await waitFor(() => expect(screen.getByRole('heading', { name: 'P' })).toBeInTheDocument());
    expect(screen.getByText('Chưa có đánh giá nào.')).toBeInTheDocument();
    expect(mockGetProductReviews).toHaveBeenCalledWith(1, { page: 1, limit: 20, sort: '-createdAt' }, 'tok');
  });

  // TC-product-detail-002: shows out-of-stock state and disables actions
  it('TC-product-detail-002 - disables action buttons when stock is zero', async () => {
    // Arrange: mock product with variant stock = 0 and one selectable combination
    // CheckDOM: out-of-stock warning and disabled action buttons
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'Out',
        description: 'desc',
        price: '1000',
        discount: '0.00',
        stock: 0,
        categoryId: 1,
        category: { id: 1, name: 'Cat' },
        mainImageUrl: '/main.png',
        images: [],
        variants: [
          {
            id: 11,
            sku: 'SKU-1',
            price: '1000',
            stock: 0,
            imageUrl: '/v.png',
            color: { id: 1, color: 'Đỏ' },
            size: { id: 2, size: 'M' },
          },
        ],
      }),
    });

    // Act: render and select color + size
    render(<ProductDetail />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Out' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Đỏ' }));
    await userEvent.click(screen.getByRole('button', { name: 'M' }));

    // Assert: warning appears and actions remain disabled
    // Rollback: mocks are reset in beforeEach
    expect(screen.getByText('Mẫu đã hết hàng hãy chọn mẫu khác')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mua ngay' })).toBeDisabled();
  });

  // TC-product-detail-003: toggles seller reply in reviews section
  it('TC-product-detail-003 - toggles seller reply visibility in reviews', async () => {
    // Arrange: mock product and one review having seller reply
    // CheckDOM: reply content appears only after toggle click
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'P',
        description: 'desc',
        price: '1000',
        discount: '0.00',
        stock: 5,
        categoryId: 1,
        category: { id: 1, name: 'Cat' },
        mainImageUrl: '/main.png',
        images: [],
        variants: [],
      }),
    });
    mockGetProductReviews.mockResolvedValueOnce({
      data: [
        {
          id: 500,
          orderItemId: 1,
          productId: 1,
          rating: 5,
          comment: 'Tốt',
          sellerReply: 'Cảm ơn bạn',
          user: { id: 2, name: 'An', email: 'an@mail.com' },
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    // Act: render and click "view seller reply"
    render(<ProductDetail />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByText('Xem phản hồi của shop')).toBeInTheDocument());
    expect(screen.queryByText('Cảm ơn bạn')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Xem phản hồi của shop'));

    // Assert: reply becomes visible after toggle
    // Rollback: mocks are reset in beforeEach
    expect(screen.getByText('Cảm ơn bạn')).toBeInTheDocument();
  });
});
