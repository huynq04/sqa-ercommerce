import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import CategoryPage from './CategoryPage';

const Wrapper = ({ children, route = '/category/1' }: any) => (
  <MemoryRouter initialEntries={[route]}>
    <Routes>
      <Route path="/category/:id" element={children} />
    </Routes>
  </MemoryRouter>
);

describe('CategoryPage', () => {
  // TC-category-page-001: shows category title and empty products message
  it('TC-category-page-001 - displays category name and empty state', async () => {
    // Arrange: mock sequential fetch responses
    const category = { id: 1, name: 'Cat', products: [], parent: null, children: [] };
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => category }) // category
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) }); // root list

    // Act
    render(<CategoryPage />, { wrapper: (props) => <Wrapper {...props} /> });

    // Assert
    await waitFor(() => expect(screen.getByText('Cat')).toBeInTheDocument());
    expect(screen.getByText(/Không có sản phẩm/)).toBeInTheDocument();
  });
});
