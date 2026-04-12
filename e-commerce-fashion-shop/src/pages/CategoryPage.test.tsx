import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';

import CategoryPage from './CategoryPage';

vi.mock('../components/ProductCard', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="product-card">{props.title}</div>,
}));

const Wrapper = ({ children, route = '/category/1' }: { children: ReactNode; route?: string }) => (
  <MemoryRouter initialEntries={[route]}>
    <Routes>
      <Route path="/category/:id" element={children} />
    </Routes>
  </MemoryRouter>
);

describe('CategoryPage', () => {
  // TC-category-page-001: shows category title and empty products message
  it('TC-category-page-001 - displays category name and empty state', async () => {
    // Arrange: mock category detail and root categories response
    // CheckNetwork: calls category and categories endpoints
    const category = { id: 1, name: 'Cat', products: [], parent: null, children: [] };
    (globalThis as any).fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => category }) // category
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) }); // root list

    // Act: render category page
    render(<CategoryPage />, { wrapper: (props) => <Wrapper {...props} /> });

    // Assert: page title and empty message are shown
    // Rollback: fetch mock is recreated per test
    await waitFor(() => expect(screen.getByText('Cat')).toBeInTheDocument());
    expect(screen.getByText(/Không có sản phẩm/)).toBeInTheDocument();
  });

  // TC-category-page-002: renders products when category has items
  it('TC-category-page-002 - renders product cards when products exist', async () => {
    // Arrange: category contains one product and root list
    // CheckDOM: product card list should be rendered
    const category = {
      id: 1,
      name: 'Cat',
      description: '',
      products: [{ id: 10, name: 'P1', price: '100', discount: '0.00', stock: 2, categoryId: 1 }],
      parent: null,
      children: [],
    };
    (globalThis as any).fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => category })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    // Act: render category page
    render(<CategoryPage />, { wrapper: (props) => <Wrapper {...props} /> });

    // Assert: product title and count summary are visible
    // Rollback: fetch mock is recreated per test
    await waitFor(() => expect(screen.getByTestId('product-card')).toBeInTheDocument());
    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByText(/Hiển thị 1 \/ 1 kết quả/)).toBeInTheDocument();
  });

  // TC-category-page-003: shows not-found state when category fetch fails
  it('TC-category-page-003 - shows not found message after fetch error', async () => {
    // Arrange: first fetch throws to simulate loading failure
    // CheckDOM: not-found fallback should appear
    (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error('network error'));

    // Act: render category page
    render(<CategoryPage />, { wrapper: (props) => <Wrapper {...props} /> });

    // Assert: fallback message is displayed
    // Rollback: fetch mock is recreated per test
    await waitFor(() => expect(screen.getByText('Không tìm thấy danh mục.')).toBeInTheDocument());
  });
});
