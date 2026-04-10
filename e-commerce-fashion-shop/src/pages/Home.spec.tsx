import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../components/ProductCard', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="product-card">{props.title}</div>,
}));

// Mock Banner which imports static assets to avoid module resolution errors
jest.mock('../components/Banner', () => ({
  __esModule: true,
  default: () => <div data-testid="banner" />,
}));

// Mock Carousel which imports images
jest.mock('../components/Carousel', () => ({
  __esModule: true,
  default: () => <div data-testid="carousel" />,
}));

jest.mock('../api/recommendationsApi', () => ({
  getRecommendations: jest.fn().mockResolvedValue([]),
}));

import Home from './Home';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('Home page', () => {
  // TC-home-001: renders featured products from fetch
  it('TC-home-001 - shows featured products after fetch', async () => {
    // Arrange
    const mockProducts = { data: Array.from({ length: 8 }).map((_, i) => ({ id: i + 1, name: `P${i + 1}`, price: 100 })) };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockProducts });

    // Act
    render(<Home />, { wrapper: Wrapper });

    // Assert: wait for ProductCard mocks
    await waitFor(() => expect(screen.getAllByTestId('product-card').length).toBeGreaterThanOrEqual(1));
  });
});
