import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

vi.mock('../components/ProductCard', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="product-card">{props.title}</div>,
}));

// Mock Banner which imports static assets to avoid module resolution errors
vi.mock('../components/Banner', () => ({
  __esModule: true,
  default: () => <div data-testid="banner" />,
}));

// Mock Carousel which imports images
vi.mock('../components/Carousel', () => ({
  __esModule: true,
  default: () => <div data-testid="carousel" />,
}));

const mockGetRecommendations = vi.fn();
vi.mock('../api/recommendationsApi', () => ({
  getRecommendations: (...args: any[]) => mockGetRecommendations(...args),
}));

import Home from './Home';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetRecommendations.mockResolvedValue([]);
  Object.defineProperty(globalThis, 'localStorage', {
    value: { getItem: vi.fn().mockReturnValue(null) },
    configurable: true,
  });
});

describe('Home page', () => {
  // TC-home-001: renders featured products from fetch
  it('TC-home-001 - shows featured products after fetch', async () => {
    // Arrange: mock featured products endpoint and no personalized products
    // CheckNetwork: fetch is used for featured list only
    const mockProducts = { data: Array.from({ length: 8 }).map((_, i) => ({ id: i + 1, name: `P${i + 1}`, price: 100 })) };
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockProducts });

    // Act: render Home page
    render(<Home />, { wrapper: Wrapper });

    // Assert: featured product cards are rendered
    // Rollback: clear mocks in beforeEach
    await waitFor(() => expect(screen.getAllByTestId('product-card').length).toBeGreaterThanOrEqual(1));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/products?page=1&limit=100&sort=-createdAt'));
  });

  // TC-home-002: hides personalized section when user is not logged in
  it('TC-home-002 - does not show recommendation section without token', async () => {
    // Arrange: featured endpoint returns one product and localStorage has no token
    // CheckDOM: recommendation heading should stay hidden
    const mockProducts = { data: [{ id: 1, name: 'A', price: '100', discount: '0.00' }] };
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockProducts });

    // Act: render Home page
    render(<Home />, { wrapper: Wrapper });

    // Assert: featured item appears but recommendation section is hidden
    // Rollback: clear mocks in beforeEach
    await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument());
    expect(screen.queryByText('Sản phẩm bạn có thể quan tâm')).not.toBeInTheDocument();
    expect(mockGetRecommendations).not.toHaveBeenCalled();
  });

  // TC-home-003: shows recommendation error text when API fails with non-auth error
  it('TC-home-003 - shows recommendation error when API fails', async () => {
    // Arrange: user has token, recommendation API fails, featured still loads
    // CheckDOM: recommendation section should show error text
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn().mockReturnValue('token') },
      configurable: true,
    });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    mockGetRecommendations.mockRejectedValueOnce(new Error('network down'));

    // Act: render Home page
    render(<Home />, { wrapper: Wrapper });

    // Assert: recommendation block appears with fallback error text
    // Rollback: clear mocks in beforeEach
    await waitFor(() => expect(screen.getByText('Không thể tải gợi ý ngay bây giờ.')).toBeInTheDocument());
    expect(screen.getByText('Sản phẩm bạn có thể quan tâm')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // TC-home-004: shows loading state while recommendations resolve
  it('TC-home-004 - shows loading text while recommendations are loading', async () => {
    // Arrange: token exists, featured loads, recommendations pending
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn().mockReturnValue('token') },
      configurable: true,
    });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    let resolveRec: (value: any) => void;
    const recPromise = new Promise((resolve) => {
      resolveRec = resolve as any;
    });
    mockGetRecommendations.mockReturnValueOnce(recPromise);

    // Act
    render(<Home />, { wrapper: Wrapper });

    // Assert: loading state appears
    await waitFor(() =>
      expect(screen.getByText('Đang tải gợi ý...')).toBeInTheDocument(),
    );

    // Cleanup
    resolveRec!([]);
  });

  // TC-home-005: shows recommendation section when data returned
  it('TC-home-005 - renders recommendations when API returns data', async () => {
    // Arrange: token exists and API returns recommendations
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn().mockReturnValue('token') },
      configurable: true,
    });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    mockGetRecommendations.mockResolvedValueOnce([
      { id: 1, name: 'Rec-1', price: 100 },
      { id: 2, name: 'Rec-2', price: 200 },
    ]);

    // Act
    render(<Home />, { wrapper: Wrapper });

    // Assert
    await waitFor(() =>
      expect(screen.getByText('Sản phẩm bạn có thể quan tâm')).toBeInTheDocument(),
    );
    expect(screen.getByText('Rec-1')).toBeInTheDocument();
    expect(screen.getByText('Rec-2')).toBeInTheDocument();
  });

  // TC-home-006: hides recommendation section on unauthorized error
  it('TC-home-006 - hides recommendations when API returns unauthorized', async () => {
    // Arrange
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn().mockReturnValue('token') },
      configurable: true,
    });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    mockGetRecommendations.mockRejectedValueOnce(new Error('unauthorized'));

    // Act
    render(<Home />, { wrapper: Wrapper });

    // Assert
    await waitFor(() =>
      expect(screen.queryByText('Sản phẩm bạn có thể quan tâm')).not.toBeInTheDocument(),
    );
    expect(screen.queryByText('Không thể tải gợi ý ngay bây giờ.')).not.toBeInTheDocument();
  });
});
