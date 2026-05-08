import { AdminCategoryController } from '../controllers/admin-category.controller';

describe('AdminCategoryController', () => {
  let controller: AdminCategoryController;
  // Mock service để kiểm tra controller có forward đúng dữ liệu hay không.
  const mockService: any = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    controller = new AdminCategoryController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-ADMIN-CATEGORY-CONTROLLER-001 - create forwards dto', async () => {
    // Khi admin tạo danh mục mới, controller chỉ có nhiệm vụ chuyển nguyên dto xuống service.
    const dto = { name: 'A' } as any;
    mockService.create.mockResolvedValue({ id: 1 });

    const result = await controller.create(dto);

    // Đảm bảo không có transform ngoài ý muốn: input/response phải đi xuyên suốt như service định nghĩa.
    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1 });
  });

  it('TC-ADMIN-CATEGORY-CONTROLLER-002 - update forwards dto and returns result', async () => {
    // Update danh mục cần gửi cả id và trường thay đổi; controller không tự xử lý business rule.
    const dto = { id: 1, name: 'B' } as any;
    mockService.update.mockResolvedValue({ id: 1, name: 'B' });

    const result = await controller.update(dto);

    // Kiểm tra đúng luồng gọi service.update và dữ liệu phản hồi trả về cho client.
    expect(mockService.update).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, name: 'B' });
  });

  it('TC-ADMIN-CATEGORY-CONTROLLER-003 - delete calls service and returns message', async () => {
    // Service delete trả void, còn thông điệp thành công là trách nhiệm của controller.
    mockService.delete.mockResolvedValue(undefined);

    const result = await controller.delete(4);

    // Xác nhận controller gọi đúng id và trả message dạng API contract mong đợi.
    expect(mockService.delete).toHaveBeenCalledWith(4);
    expect(result).toEqual({ message: expect.any(String) });
  });

  it('TC-ADMIN-CATEGORY-CONTROLLER-004 - create throws when service fails', async () => {
    const dto = { name: 'A' } as any;
    const error = new Error('create failed');
    mockService.create.mockRejectedValue(error);

    await expect(controller.create(dto)).rejects.toThrow(error);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('TC-ADMIN-CATEGORY-CONTROLLER-005 - update throws when service fails', async () => {
    const dto = { id: 1, name: 'B' } as any;
    const error = new Error('update failed');
    mockService.update.mockRejectedValue(error);

    await expect(controller.update(dto)).rejects.toThrow(error);
    expect(mockService.update).toHaveBeenCalledWith(dto);
  });

  it('TC-ADMIN-CATEGORY-CONTROLLER-006 - delete throws when service fails', async () => {
    const error = new Error('delete failed');
    mockService.delete.mockRejectedValue(error);

    await expect(controller.delete(10)).rejects.toThrow(error);
    expect(mockService.delete).toHaveBeenCalledWith(10);
  });

  it('TC-ADMIN-CATEGORY-CONTROLLER-007 - create forwards missing required fields', async () => {
    const dto = { description: 'x' } as any;
    mockService.create.mockResolvedValue({ id: 1 });

    const result = await controller.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1 });
  });

  it('TC-ADMIN-CATEGORY-CONTROLLER-008 - update forwards invalid payload without validation', async () => {
    const dto = { id: 1, name: 123 } as any;
    mockService.update.mockResolvedValue({ id: 1 });

    const result = await controller.update(dto);

    expect(mockService.update).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1 });
  });

  it('TC-ADMIN-CATEGORY-CONTROLLER-009 - delete forwards non-numeric id without pipe', async () => {
    mockService.delete.mockResolvedValue(undefined);

    const result = await controller.delete('10' as any);

    expect(mockService.delete).toHaveBeenCalledWith('10');
    expect(result).toEqual({ message: expect.any(String) });
  });
});
