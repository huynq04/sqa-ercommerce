# GitHub Copilot — Custom Instructions (dam-bao-chat-luong-phan-mem)

## Purpose
This file provides project-specific guidance for Copilot/agent to generate unit tests for the ecommerce module in this repository.

Key rules
- Use `jest` + Nest `TestingModule` for unit tests.
- Mock DB interactions with `getRepositoryToken()`; prefer mocking over touching real DBs in unit tests.
- If a test touches DB (integration), include `CheckDB` and `Rollback` steps and clearly document them in comments.

Required conventions
- Every test case must begin with a comment `TC-<file-short>-<NNN>` on the first line of the `it` block. Example:
	// TC-user-product-001: findById returns product when exists
- Each test comment must document: `Arrange` (mocks/data), `Act` (call), `Assert` (expectations), `CheckDB` (if applicable), `Rollback` (if applicable).
 - Generated spec files must be placed next to the source file they test (colocated). Use the same directory as the source and name the spec with a `.spec.ts` suffix. Example:
 	- Source: `src/modules/ecommerce/services/user-product.service.ts`
 	- Test: `src/modules/ecommerce/services/user-product.service.spec.ts`

Template example to include in generated specs
```ts
// TC-user-product-001: findById returns product when exists
it('TC-user-product-001 - returns product when found', async () => {
	// Arrange: mockProductRepo.findOne returns sampleProduct
	// CheckDB: mocked - no DB touch
	// Act: const res = await service.findById(1)

	// Assert: expect(res).toEqual(sampleProduct)
	// Rollback: mocked - nothing to rollback
});
```

Test conventions (mandatory)
- Every test case must begin with a comment line containing a Test Case ID using the format `TC-<file-short>-<NNN>`.
- Place generated spec files under `test/` following the source layout.
- Use clear variable names: e.g., `mockCategoryRepo`, `mockProductEntity`.

Running tests locally
```bash
# chạy test từng file: ví dụ (gọi trực tiếp file spec colocated)
npx jest src/modules/ecommerce/services/user-review.service.spec.ts
```

Code Coverage Report

1.6. Code Coverage Report: Tóm tắt kết quả độ bao phủ mã nguồn kèm theo ảnh chụp màn hình được tạo từ công cụ đo coverage (Jest cho NestJS).
- Yêu cầu: Khi mở PR hoặc nộp báo cáo, đính kèm bản tóm tắt độ bao phủ (console summary hoặc `coverage/coverage-summary.json`) và ít nhất một ảnh chụp màn hình của báo cáo HTML (coverage/lcov-report/index.html).
- Ví dụ (Jest + NestJS):

```bash
# Nếu dự án chưa cài Jest (thường đã có trong NestJS):
npm install --save-dev jest ts-jest @types/jest

# Chạy tests với báo cáo coverage
npx jest --coverage
# hoặc qua npm script: npm run test -- --coverage

# Báo cáo HTML sẽ được tạo tại: coverage/lcov-report/index.html
# Mở file đó trong trình duyệt và chụp màn hình để đính kèm vào PR
```

- Gợi ý: thêm script trong `package.json` để dễ chạy:

```json
"scripts": {
	"test:cov": "jest --coverage"
}
```

- Lưu ý CI: nhiều CI systems (GitHub Actions, GitLab CI) sẽ lưu artefact `coverage/lcov-report` hoặc `coverage/coverage-summary.json` — đính kèm hoặc liên kết tới artefact trong PR.
