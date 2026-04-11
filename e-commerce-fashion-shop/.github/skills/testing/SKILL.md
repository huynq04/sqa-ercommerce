---
name: testing
description: Hướng dẫn agent tự động tạo unit & component tests (Jest + React Testing Library) cho dự án e-commerce-fashion-shop
description: Hướng dẫn agent tự động tạo unit & component tests (Jest + React Testing Library) cho dự án e-commerce-fashion-shop — ưu tiên tạo file test colocated (cùng cấp với file nguồn)
---

Mục đích
- Hướng dẫn agent tạo tests cho các file UI và API của frontend: components, pages, và API helpers.

Phạm vi (các file ưu tiên)
- src/api/productsApi.ts
- src/api/categoriesApi.ts
- src/api/recommendationsApi.ts
- src/api/reviewsApi.ts
- src/pages/Home.tsx
- src/pages/Shop.tsx
- src/pages/CategoryPage.tsx
- src/pages/ProductDetail.tsx
- src/components/ProductCard.tsx

Hướng dẫn cho agent (bước chi tiết)
1. Đọc file nguồn được chỉ định và xác định exported functions / React components.
2. Quyết định loại test:
   - API util/function: unit test, mock `fetch`/`axios` (jest.fn() hoặc `msw`).
   - Component: render bằng `@testing-library/react` (render, screen, userEvent).
   - Page: render component in isolation; for pages using router params, wrap with `MemoryRouter` and provide route params.
3. Tạo file spec cùng cấp (colocated) với file nguồn. Đặt test trong cùng thư mục với file được test và thêm hậu tố `.spec.ts` / `.spec.tsx`. Ví dụ:
   - Source: `src/components/ProductCard.tsx`
   - Test: `src/components/ProductCard.spec.tsx`
4. Với mỗi exported function / component, tạo test cases tối thiểu:
   - Happy path: kiểm tra render/return đúng.
   - Edge cases: missing props, error response, loading states.
   - Interaction: button clicks, form submits using `userEvent`.
5. Mocks & network
   - Dùng `jest.spyOn` hoặc `jest.mock('axios')` để mock network; hoặc recommend `msw` for more realistic handlers.
   - Ensure tests never call real network.
6. Test Case metadata (bắt buộc)
   - Mỗi `it` phải bắt đầu bằng 1 dòng comment `TC-<file-short>-<NNN>`.
   - Trong comment nêu: Arrange, Act, Assert, CheckDOM/CheckNetwork, Rollback (if applicable).

Templates

Component (ProductCard) template:
```tsx
// TC-product-card-001: renders product title, price and Add to Cart
it('TC-product-card-001 - renders product title and price', () => {
  // Arrange: sample props
  // CheckDOM: no network
  // Act: render(<ProductCard {...props} />)
  // Assert: expect(screen.getByText(props.name)).toBeInTheDocument()
});
```

API util template:
```ts
// TC-products-api-001: getProducts returns product list
it('TC-products-api-001 - returns product list', async () => {
  // Arrange: mock fetch/axios to return sample data
  // Act: const res = await productsApi.getProducts()
  // Assert: expect(res).toEqual(sampleData)
});
```

Page template (with router):
```tsx
// TC-product-detail-001: shows product info when id provided
it('TC-product-detail-001 - shows product info for route id', async () => {
  // Arrange: mock API to return product
  // Act: render page wrapped with MemoryRouter initialEntries ['/product/1']
  // Assert: expect product title visible
});
```

Best practices
- Keep tests deterministic: mock timers (`jest.useFakeTimers`) if needed and restore after.
- Clear mocks after each test: `afterEach(() => jest.clearAllMocks())`.
- Use `screen` queries (getByRole/getByText) and prefer `getByRole` when possible.
- Name mocks clearly: `mockProductsResponse`, `mockFetchProducts`.

Output mong đợi từ agent
- Tạo các file spec Jest + React Testing Library colocated (bên cạnh file nguồn).
- Mỗi test có Test Case ID và comment Arrange/Act/Assert/CheckDOM/CheckNetwork/Rollback.
- Không chạy hoặc commit tự động — chỉ tạo/patch file spec trong workspace.

Chạy tests local
```bash
npm install
npx jest src/path/to/YourFile.spec.tsx
npx jest --coverage
```
