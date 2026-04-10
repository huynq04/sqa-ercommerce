import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import ProductDetail from './ProductDetail';

const Wrapper = ({ children }: any) => (
  <MemoryRouter initialEntries={["/product/1"]}>
    <Routes>
      <Route path="/product/:id" element={children} />
    </Routes>
  </MemoryRouter>
);

describe('ProductDetail', () => {
  // TC-product-detail-001: initial loading state is shown
  it('TC-product-detail-001 - shows product after fetch', async () => {
    // Arrange: mock fetch to prevent network error (product and reviews)
    (global as any).fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/reviews')) {
        return Promise.resolve({ ok: true, json: async () => ({ data: [], total: 0, page: 1, limit: 20 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ id: 1, name: 'P', price: '1000', images: [], variants: [], discount: '0.00' }) });
    });

    // Act
    render(<ProductDetail />, { wrapper: Wrapper });

    // Wait for product to appear (this wraps async state updates in act)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'P' })).toBeInTheDocument());
  });
});
