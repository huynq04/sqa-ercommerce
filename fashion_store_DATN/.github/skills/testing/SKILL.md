---
name: testing
description: Hướng dẫn agent tạo unit tests (Jest + Nest TestingModule) với file test đặt cùng cấp với file nguồn được test
---
Mục đích
- Hướng dẫn agent tạo unit tests (Jest + Nest `TestingModule`) cho các file trong dự án `fashion_store_DATN`.

Nguyên tắc chính
- Sử dụng `jest` + `@nestjs/testing` cho unit test.
- Mock mọi tương tác với DB bằng `getRepositoryToken()`; ưu tiên unit test (không chạm DB).
- Nếu cần integration test chạm DB, phải ghi rõ `CheckDB` và `Rollback` trong comment của test.

Vị trí file spec (QUY ĐỊNH MỚI)
- Thay vì đưa mọi spec vào thư mục chung `test/`, file spec phải được tạo "cùng cấp" (colocated) với file nguồn mà nó kiểm thử.
- Tên file: đặt cùng tên với file nguồn, thêm hậu tố `.spec.ts` trước phần mở rộng. Ví dụ:
  - Source: `src/modules/ecommerce/services/user-product.service.ts`
  - Test: `src/modules/ecommerce/services/user-product.service.spec.ts`

Quy ước bắt buộc cho nội dung test
- Mỗi `it` block phải bắt đầu bằng một dòng comment chứa Test Case ID theo định dạng `TC-<file-short>-<NNN>` (ví dụ `TC-user-product-001`).
- Trong comment test phải mô tả: `Arrange` (mock/data), `Act` (gọi hàm), `Assert` (kỳ vọng), `CheckDB` (nếu có), `Rollback` (nếu có).

Template mẫu (bắt buộc có trong mỗi file spec)
```ts
// TC-<file-short>-001: <mô tả ngắn>
it('TC-<file-short>-001 - <mô tả ngắn>', async () => {
  // Arrange: mock repository / dữ liệu mẫu
  // CheckDB: mocked - no DB touch
  // Act: gọi method cần test
  // Assert: kiểm tra output và verify mock calls
  // Rollback: mocked - nothing to rollback
});
```

CheckDB / Rollback
- Unit test: mock toàn bộ repo; ghi `// CheckDB: mocked - no DB touch`.
- Integration test (chỉ khi cần): mở transaction hoặc snapshot trước test, sau test rollback hoặc restore snapshot và ghi rõ trong comment.

Gợi ý triển khai mocks
- Dùng `getRepositoryToken(Entity)` để mock repository.
- Mock `createQueryBuilder()` khi service dùng query builder (trả về `mockQueryBuilder` có các method chuỗi `jest.fn()`).
- Tên mocks rõ ràng: `mockProductRepo`, `mockCategoryRepo`, `mockQueryBuilder`, v.v.

Output mong đợi từ agent
- Tạo file spec colocated (ví dụ `src/.../file.spec.ts`).
- Mỗi test case có Test Case ID và comment Arrange/Act/Assert/CheckDB/Rollback.
- Không tự động commit; chỉ tạo/patch file trong workspace.

Ghi chú
- Khi chuyển test từ cấu trúc cũ (`test/...`) sang colocated, agent có thể tạo file mới bên cạnh file nguồn và giữ lại nội dung test đã có nếu chuyển được.

Export & Reporting
- Khi tạo test cases, xuất danh sách test case thành bảng Excel/CSV theo mẫu trong repository `.github/skills/export-excel/SKILL.md`.
- Cột bắt buộc: `Test Case ID, File/Class, Function, Test Objective, Input, Expected Output, Actual Output, Status, CheckDB, Notes`.

Target files for bulk test generation
- The instructor requires high coverage on the following files. Agents must prioritize these (create colocated specs):
  - src/modules/ecommerce/services/user-product.service.ts
  - src/modules/ecommerce/controllers/user-product.controller.ts
  - src/modules/ecommerce/services/user-category.service.ts
  - src/modules/ecommerce/controllers/user-category.controller.ts
  - src/modules/ecommerce/services/user-review.service.ts
  - src/modules/ecommerce/controllers/user-review.controller.ts
  - src/modules/ecommerce/services/recommendation.service.ts
  - src/modules/ecommerce/controllers/user-recommendation.controller.ts
  - src/modules/ecommerce/services/admin-product.service.ts
  - src/modules/ecommerce/controllers/admin-product.controller.ts
  - src/modules/ecommerce/services/admin-category.service.ts
  - src/modules/ecommerce/controllers/admin-category.controller.ts

High-coverage requirements
- For each target file, generate a comprehensive spec that covers:
  - Happy path(s) and typical usage
  - Input validation and missing/invalid parameters
  - Edge cases (empty lists, boundary values)
  - Error paths (DB exceptions, thrown errors, external failures)
  - Security-related edge cases (injection-like inputs, permission checks)
  - Interaction and integration points (calls to other services or repositories) mocked explicitly
  - For controllers: ensure proper status codes and response shapes are asserted

Test-case generation conventions (strict)
- Place spec next to source file: `src/.../file.spec.ts`.
- Each `it` MUST start with a single-line Test Case ID comment: `TC-<file-short>-<NNN>`.
- Use descriptive test names: `TC-<id> - <short description>`.
- Include comments inside tests describing `Arrange`, `Act`, `Assert`, `CheckDB`, and `Rollback` (if applicable).
- When a test touches DB state (integration tests), create/restore snapshots or transactions and clearly mark `CheckDB` and `Rollback` lines in the test comments.
- Mock all repositories by default using `getRepositoryToken()`.
- When a function uses QueryBuilder, provide a reusable `mockQueryBuilder` helper in the spec and reuse across tests.

Test quantity guidance
- Aim to produce at least 8-20 meaningful test cases per complex service file (e.g., product services) and 6-12 test cases per controller, depending on the number of branches and endpoints. The goal is high logical branch coverage, not arbitrary tests.

Exporting test catalog
- For each generated spec, append a CSV row to the export template (`.github/skills/export-excel/SKILL.md`) with the required columns. Include `CheckDB: YES/NO` as appropriate.

Automation checklist for agents
1. Read this SKILL.md and `.github/skills/export-excel/SKILL.md`.
2. For each target file, open the source and identify public methods / controller routes to cover.
3. Create a colocated spec file with imports, a `describe` block, and a set of `it` blocks following the conventions above.
4. Add reusable mock helpers for repositories and query builders at the top of the spec.
5. For each `it`, include Test Case ID comment and Arrange/Act/Assert/CheckDB/Rollback details.
6. Add or append corresponding CSV rows into the export template file.
7. Run `npx jest --listTests` to verify the new spec is discoverable (optional in automation).

Notes for reviewers
- Generated tests should be reviewed for meaningful assertions and not just existence. Tests that only assert mocks were called count less toward coverage; prefer asserting returned values and side-effects.
