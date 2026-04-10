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
