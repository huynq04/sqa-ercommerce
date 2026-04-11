# GitHub Copilot — Custom Instructions (e-commerce-fashion-shop)

## Purpose
This file provides project-specific guidance for Copilot/agent to generate unit and component tests for the frontend app in this repository (React + Vite + TypeScript).

Key rules
- Use `jest` + React Testing Library for UI/component tests.
- Use `msw` or jest mocks for network/API calls in unit tests (avoid real network).
 - Use `msw` or jest mocks for network/API calls in unit tests (avoid real network).
 - Place generated tests next to the source files they test (colocated). Use the same directory as the source and name the test file with a `.spec.ts` / `.spec.tsx` suffix. Example:
   - Source: `src/pages/ProductDetail.tsx`
   - Test: `src/pages/ProductDetail.spec.tsx`
- Use environment variables for config — never hardcode secrets.

Required conventions
- Test file naming: use `.spec.ts` / `.spec.tsx` suffix.
- Test Case ID: every `it` block must start with a comment `TC-<file-short>-<NNN>` on the first line, e.g., `// TC-product-card-001`.
- Each test comment must document: `Arrange` (mocks/data), `Act` (render/call), `Assert` (expectations), `CheckDOM`/`CheckNetwork` (if applicable), `Rollback` (if applicable).

Templates & examples
Component test (React Testing Library):
```ts
// TC-product-card-001: renders product info and Add to Cart button
it('TC-product-card-001 - renders product info and Add to Cart', () => {
  // Arrange: sample product props
  // Act: render(<ProductCard {...props} />)
  // Assert: expect name, price, image and button are present
});
```

API util test (mock fetch/axios):
```ts
// TC-products-api-001: fetchProducts returns parsed data
it('TC-products-api-001 - returns parsed products', async () => {
  // Arrange: mock fetch/axios response
  // Act: const res = await getProducts()
  // Assert: expect(res).toEqual(sampleProducts)
});
```

Running tests locally
```bash
# install deps (if needed)
npm install

# run jest in watch or once
npx jest

# run with coverage
npx jest --coverage
```

Output expectations
- Tests should run in Node + jsdom.
- Generated tests should not call real network or modify production data.

When writing tests, follow the `testing` skill under `.github/skills/testing` for the project's conventions.
Note: the testing skill has been updated to prefer colocated tests; follow it when generating tests.
