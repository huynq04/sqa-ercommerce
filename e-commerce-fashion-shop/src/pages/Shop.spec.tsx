import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../components/ProductCard', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="product-card">{props.title}</div>,
}));

import Shop from './Shop';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/shop?q="]}>{children}</MemoryRouter>
);

describe('Shop page', () => {
  // TC-shop-001: renders products from fetch
  it('TC-shop-001 - shows products after fetch', async () => {
    // Arrange
    const mockProducts = { data: [{ id: 1, name: 'A', price: 10 }], total: 1 };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockProducts });

    // Act
    render(<Shop />, { wrapper: Wrapper });

    // Assert
    await waitFor(() => expect(screen.getAllByTestId('product-card').length).toBeGreaterThanOrEqual(1));
  });
});
