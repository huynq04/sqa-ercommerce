import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from './ProductCard';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('ProductCard', () => {
  // TC-product-card-001: renders title, price and image
  it('TC-product-card-001 - renders title, price and image', () => {
    // Arrange
    render(
      <ProductCard title="T1" price={'1000'} discount={'10.00'} image={'/img.png'} to={'/product/1'} />,
      { wrapper: Wrapper },
    );

    // Act & Assert
    expect(screen.getByText('T1')).toBeInTheDocument();
    const img = screen.getByAltText('T1') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('/img.png');
    expect(screen.getByText(/-10%/)).toBeInTheDocument();
  });
});
