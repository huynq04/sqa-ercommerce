import { UserCategoryController } from './user-category.controller';

describe('UserCategoryController', () => {
  let controller: UserCategoryController;
  // Service giả lập để kiểm tra forwarding logic của controller.
  const mockService: any = {
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(() => {
    controller = new UserCategoryController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-USER-CATEGORY-CONTROLLER-001 - getAll forwards to service', async () => {
    // Arrange: query phân trang và dữ liệu giả trả về.
    const query = { page: 1 } as any;
    mockService.findAll.mockResolvedValue({ items: [], total: 0 });

    // Act
    const result = await controller.getAll(query);

    // Assert: controller phải chuyển query đúng sang service.findAll.
    expect(mockService.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('TC-USER-CATEGORY-CONTROLLER-002 - getAll forwards undefined query', async () => {
    mockService.findAll.mockResolvedValue({ items: [], total: 0 });

    const result = await controller.getAll(undefined as any);

    expect(mockService.findAll).toHaveBeenCalledWith(undefined);
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('TC-USER-CATEGORY-CONTROLLER-003 - getAll should bubble error from service', async () => {
    mockService.findAll.mockRejectedValue(new Error('db fail'));

    await expect(controller.getAll({ page: 1 } as any)).rejects.toThrow('db fail');
  });

  it('TC-USER-CATEGORY-CONTROLLER-004 - getOne forwards id to service', async () => {
    // Arrange: mock kết quả khi tìm category theo id.
    mockService.findById.mockResolvedValue({ id: 2, name: 'ao so mi', description: 'danh muc' });

    // Act
    const result = await controller.getOne(2);

    // Assert: xác minh id được forward chính xác.
    expect(mockService.findById).toHaveBeenCalledWith(2);
    expect(result).toEqual({ id: 2, name: 'ao so mi', description: 'danh muc' });
  });

  it('TC-USER-CATEGORY-CONTROLLER-005 - getOne should bubble error from service', async () => {
    mockService.findById.mockRejectedValue(new Error('not found'));

    await expect(controller.getOne(999)).rejects.toThrow('not found');
  });
});
