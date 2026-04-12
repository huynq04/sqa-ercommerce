import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

jest.mock('../components/ProductCard', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="product-card">{props.title}</div>,
}));

import Shop from './Shop';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={["/shop?q="]}>{children}</MemoryRouter>
);

describe('Shop page', () => {
  // TC-shop-001: renders products from fetch
  it('TC-shop-001 - shows products after fetch', async () => {
    // Arrange: mock list endpoint response with one product
    // CheckNetwork: fetch is called with default pagination query
    const mockProducts = { data: [{ id: 1, name: 'A', price: 10 }], total: 1 };
    (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockProducts });

    // Act: render shop page
    render(<Shop />, { wrapper: Wrapper });

    // Assert: product card list is rendered
    // Rollback: jest clears mocks between tests
    await waitFor(() => expect(screen.getAllByTestId('product-card').length).toBeGreaterThanOrEqual(1));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/products?page=1&limit=8&sort=-createdAt'),
    );
  });

  // TC-shop-002: appends encoded q param when searching
  it('TC-shop-002 - appends encoded q query param', async () => {
    // Arrange: use route containing q query and mock empty result
    // CheckNetwork: verify encoded q appears in request URL
    const mockProducts = { data: [], total: 0 };
    (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockProducts });

    // Act: render with search keyword
    render(
      <MemoryRouter initialEntries={['/shop?q=áo nam']}>
        <Shop />
      </MemoryRouter>,
    );

    // Assert: request contains encoded q and result count text is shown
    // Rollback: jest clears mocks between tests
    await waitFor(() => expect(screen.getByText(/Hiển thị 0 \/ 0 kết quả/)).toBeInTheDocument());
    const calledUrl = (fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('&q=');
    expect(calledUrl).toContain(encodeURIComponent('áo nam'));
  });

  // TC-shop-003: renders pagination controls for multi-page data
  it('TC-shop-003 - shows pagination controls when total exceeds page size', async () => {
    // Arrange: mock total larger than one page
    // CheckDOM: pagination controls should be visible
    const mockProducts = { data: [{ id: 1, name: 'A', price: 10 }], total: 16 };
    (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockProducts });

    // Act: render shop page
    render(<Shop />, { wrapper: Wrapper });

    // Assert: page indicator and next/prev buttons appear
    // Rollback: jest clears mocks between tests
    await waitFor(() => expect(screen.getByText('Trang 1 / 2')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Trước' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sau' })).toBeEnabled();
  });
});
