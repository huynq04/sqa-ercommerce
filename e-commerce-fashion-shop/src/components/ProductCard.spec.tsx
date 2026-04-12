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
    // Arrange: render card with image and discount
    // CheckDOM: discount badge and image should be visible
    render(
      <ProductCard title="T1" price={'1000'} discount={'10.00'} image={'/img.png'} to={'/product/1'} />,
      { wrapper: Wrapper },
    );

    // Act: query rendered card content
    // Assert: title, image and discount badge are shown
    // Rollback: no rollback needed
    expect(screen.getByText('T1')).toBeInTheDocument();
    const img = screen.getByAltText('T1') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('/img.png');
    expect(screen.getByText(/-10%/)).toBeInTheDocument();
  });

  // TC-product-card-002: hides discount info when discount is zero
  it('TC-product-card-002 - does not render discount badge with zero discount', () => {
    // Arrange: render card with zero discount
    // CheckDOM: no badge and no original strikethrough price
    render(<ProductCard title="T2" price={'2000'} discount={'0.00'} image={'/img2.png'} to={'/product/2'} />, {
      wrapper: Wrapper,
    });

    // Act: query badge and original price elements
    // Assert: discount badge and original price are hidden
    // Rollback: no rollback needed
    expect(screen.queryByText(/-%/)).not.toBeInTheDocument();
    expect(screen.queryByText('2.222₫')).not.toBeInTheDocument();
  });

  // TC-product-card-003: uses fallback block when image is missing
  it('TC-product-card-003 - renders fallback when image is missing', () => {
    // Arrange: render card without image prop
    // CheckDOM: image element should not be rendered
    render(<ProductCard title="No image" price={'3000'} discount={'0.00'} to={'/product/3'} />, {
      wrapper: Wrapper,
    });

    // Act: query img by accessible name
    // Assert: title and formatted price still appear without img tag
    // Rollback: no rollback needed
    expect(screen.getByText('No image')).toBeInTheDocument();
    expect(screen.getByText('3.000₫')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'No image' })).not.toBeInTheDocument();
  });
});
