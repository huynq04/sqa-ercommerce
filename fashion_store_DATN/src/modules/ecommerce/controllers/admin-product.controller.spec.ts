import {
  AdminProductColorController,
  AdminProductController,
  AdminProductImageController,
  AdminProductSizeController,
  AdminProductVariantController,
} from './admin-product.controller';

describe('AdminProductController', () => {
  let controller: AdminProductController;
  // Mock service để xác nhận controller chỉ điều phối đúng hàm nghiệp vụ.
  const mockService: any = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    controller = new AdminProductController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-ADMIN-PRODUCT-CONTROLLER-001 - create forwards dto to service', async () => {
    // Tạo sản phẩm mới: controller phải chuyển nguyên payload xuống service để xử lý nghiệp vụ.
    const dto = { name: 'P' } as any;
    mockService.create.mockResolvedValue({ id: 1 });

    const result = await controller.create(dto);

    // Đảm bảo không mất dữ liệu khi truyền dto và phản hồi trả đúng object service trả ra.
    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1 });
  });

  it('TC-ADMIN-PRODUCT-CONTROLLER-002 - update forwards dto to service', async () => {
    // Cập nhật sản phẩm: id và dữ liệu mới phải đi đúng vào service.update.
    const dto = { id: 1, name: 'P2' } as any;
    mockService.update.mockResolvedValue({ id: 1, name: 'P2' });

    const result = await controller.update(dto);

    // Kiểm tra controller chỉ đóng vai trò điều phối, không tự sửa dữ liệu.
    expect(mockService.update).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, name: 'P2' });
  });

  it('TC-ADMIN-PRODUCT-CONTROLLER-003 - delete calls service and returns message', async () => {
    // Luồng xóa thành công: service xử lý xóa, controller trả message xác nhận.
    mockService.delete.mockResolvedValue(undefined);

    const result = await controller.delete(3);

    // Đảm bảo id truyền đúng và response giữ đúng contract có field message.
    expect(mockService.delete).toHaveBeenCalledWith(3);
    expect(result).toEqual({ message: expect.any(String) });
  });

});

describe('AdminProductVariantController', () => {
  let controller: AdminProductVariantController;
  const mockService: any = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    controller = new AdminProductVariantController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-ADMIN-PRODUCT-VARIANT-CONTROLLER-001 - create forwards dto to service', async () => {
    const dto = { productId: 1, sku: 'SKU-1' } as any;
    mockService.create.mockResolvedValue({ id: 11 });

    const result = await controller.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 11 });
  });

  it('TC-ADMIN-PRODUCT-VARIANT-CONTROLLER-002 - update forwards dto to service', async () => {
    const dto = { id: 11, sku: 'SKU-2' } as any;
    mockService.update.mockResolvedValue({ id: 11, sku: 'SKU-2' });

    const result = await controller.update(dto);

    expect(mockService.update).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 11, sku: 'SKU-2' });
  });

  it('TC-ADMIN-PRODUCT-VARIANT-CONTROLLER-003 - delete calls service and returns message', async () => {
    mockService.delete.mockResolvedValue(undefined);

    const result = await controller.delete(11);

    expect(mockService.delete).toHaveBeenCalledWith(11);
    expect(result).toEqual({ message: expect.any(String) });
  });

});

describe('AdminProductColorController', () => {
  let controller: AdminProductColorController;
  const mockService: any = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    controller = new AdminProductColorController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-ADMIN-PRODUCT-COLOR-CONTROLLER-001 - findAll returns service result', async () => {
    mockService.findAll.mockResolvedValue([{ id: 1, name: 'Red' }]);

    const result = await controller.findAll();

    expect(mockService.findAll).toHaveBeenCalledWith();
    expect(result).toEqual([{ id: 1, name: 'Red' }]);
  });

  it('TC-ADMIN-PRODUCT-COLOR-CONTROLLER-002 - create forwards dto to service', async () => {
    const dto = { name: 'Red' } as any;
    mockService.create.mockResolvedValue({ id: 1, name: 'Red' });

    const result = await controller.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, name: 'Red' });
  });

  it('TC-ADMIN-PRODUCT-COLOR-CONTROLLER-003 - update forwards dto to service', async () => {
    const dto = { id: 1, name: 'Blue' } as any;
    mockService.update.mockResolvedValue({ id: 1, name: 'Blue' });

    const result = await controller.update(dto);

    expect(mockService.update).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, name: 'Blue' });
  });

  it('TC-ADMIN-PRODUCT-COLOR-CONTROLLER-004 - delete calls service and returns message', async () => {
    mockService.delete.mockResolvedValue(undefined);

    const result = await controller.delete(1);

    expect(mockService.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: expect.any(String) });
  });

});

describe('AdminProductSizeController', () => {
  let controller: AdminProductSizeController;
  const mockService: any = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    controller = new AdminProductSizeController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-ADMIN-PRODUCT-SIZE-CONTROLLER-001 - findAll returns service result', async () => {
    mockService.findAll.mockResolvedValue([{ id: 1, name: 'M' }]);

    const result = await controller.findAll();

    expect(mockService.findAll).toHaveBeenCalledWith();
    expect(result).toEqual([{ id: 1, name: 'M' }]);
  });

  it('TC-ADMIN-PRODUCT-SIZE-CONTROLLER-002 - create forwards dto to service', async () => {
    const dto = { name: 'M' } as any;
    mockService.create.mockResolvedValue({ id: 1, name: 'M' });

    const result = await controller.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, name: 'M' });
  });

  it('TC-ADMIN-PRODUCT-SIZE-CONTROLLER-003 - update forwards dto to service', async () => {
    const dto = { id: 1, name: 'L' } as any;
    mockService.update.mockResolvedValue({ id: 1, name: 'L' });

    const result = await controller.update(dto);

    expect(mockService.update).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, name: 'L' });
  });

  it('TC-ADMIN-PRODUCT-SIZE-CONTROLLER-004 - delete calls service and returns message', async () => {
    mockService.delete.mockResolvedValue(undefined);

    const result = await controller.delete(1);

    expect(mockService.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: expect.any(String) });
  });

});

describe('AdminProductImageController', () => {
  let controller: AdminProductImageController;
  const mockService: any = {
    addImage: jest.fn(),
    updateImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  beforeEach(() => {
    controller = new AdminProductImageController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-ADMIN-PRODUCT-IMAGE-CONTROLLER-001 - upload forwards dto to service', async () => {
    const dto = { productId: 1, url: 'https://img/1.jpg' } as any;
    mockService.addImage.mockResolvedValue({ id: 99, url: dto.url });

    const result = await controller.upload(dto);

    expect(mockService.addImage).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 99, url: dto.url });
  });

  it('TC-ADMIN-PRODUCT-IMAGE-CONTROLLER-002 - update forwards id and dto to service', async () => {
    const dto = { isPrimary: true } as any;
    mockService.updateImage.mockResolvedValue({ id: 99, isPrimary: true });

    const result = await controller.update(99, dto);

    expect(mockService.updateImage).toHaveBeenCalledWith(99, dto);
    expect(result).toEqual({ id: 99, isPrimary: true });
  });

  it('TC-ADMIN-PRODUCT-IMAGE-CONTROLLER-003 - delete forwards id to service', async () => {
    mockService.deleteImage.mockResolvedValue({ message: 'ok' });

    const result = await controller.delete(99);

    expect(mockService.deleteImage).toHaveBeenCalledWith(99);
    expect(result).toEqual({ message: 'ok' });
  });

});
