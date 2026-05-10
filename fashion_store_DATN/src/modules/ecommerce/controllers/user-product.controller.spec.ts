import { JwtService } from '@nestjs/jwt';
import { UserProductController } from './user-product.controller';
import { UserProductService } from '../services/user-product.service';

describe('UserProductController', () => {
  let controller: UserProductController;

  // Mock service để kiểm tra controller có gọi đúng hàm và truyền đúng tham số.
  const mockProductService: Partial<UserProductService> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    logProductView: jest.fn().mockResolvedValue(undefined),
  };

  // Mock JwtService để giả lập token hợp lệ/không hợp lệ.
  const mockJwt: Partial<JwtService> = {
    verify: jest.fn(),
  };

  beforeEach(() => {
    controller = new UserProductController(
      mockProductService as UserProductService,
      mockJwt as JwtService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-USER-PRODUCT-CONTROLLER-001 - should return all products with query', async () => {
    // Query từ client cần được chuyển nguyên sang service để giữ logic filter/paging tập trung ở service.
    const query = { page: 1 } as any;
    (mockProductService.findAll as jest.Mock).mockResolvedValue({ items: [], total: 0 });

    const result = await controller.getAll(query);

    // Xác nhận controller không tự biến đổi query và trả đúng payload service trả về.
    expect(mockProductService.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('TC-USER-PRODUCT-CONTROLLER-002 - should forward undefined query to service', async () => {
    // Query không có vẫn phải forward xuống service để áp dụng default ở tầng service.
    (mockProductService.findAll as jest.Mock).mockResolvedValue({ items: [], total: 0 });

    const result = await controller.getAll(undefined as any);

    expect(mockProductService.findAll).toHaveBeenCalledWith(undefined);
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('TC-USER-PRODUCT-CONTROLLER-003 - should bubble error when service.findAll fails', async () => {
    // Nếu service lỗi (DB lỗi), controller phải trả reject để framework map ra 500.
    (mockProductService.findAll as jest.Mock).mockRejectedValue(new Error('db fail'));

    await expect(controller.getAll({ page: 1 } as any)).rejects.toThrow('db fail');
  });

  it('TC-USER-PRODUCT-CONTROLLER-004 - should return product and log view when token valid', async () => {
    // Token hợp lệ có sub=5, vì vậy controller phải log hành vi xem sản phẩm cho user 5.
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 10 });
    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 5 });

    const req: any = { headers: { authorization: 'Bearer token123' } };

    const result = await controller.getOne(10, req);

    // Ngoài việc trả product detail, controller còn phải gọi logProductView đúng cặp userId/productId.
    expect(mockProductService.findById).toHaveBeenCalledWith(10);
    expect(mockProductService.logProductView).toHaveBeenCalledWith(5, 10);
    expect(result).toEqual({ id: 10 });
  });

  it('TC-USER-PRODUCT-CONTROLLER-005 - should extract token from cookie', async () => {
    // Trường hợp frontend gửi token qua cookie thay vì Authorization header.
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 11 });
    (mockJwt.verify as jest.Mock).mockReturnValue({ id: 7 });

    const req: any = { headers: { cookie: 'token=abc123' } };

    const result = await controller.getOne(11, req);

    // Controller phải fallback đọc cookie và vẫn log đúng user/product.
    expect(mockProductService.findById).toHaveBeenCalledWith(11);
    expect(mockProductService.logProductView).toHaveBeenCalledWith(7, 11);
    expect(result).toEqual({ id: 11 });
  });

  it('TC-USER-PRODUCT-CONTROLLER-006 - should NOT log view when token invalid', async () => {
    // Arrange: jwt.verify ném lỗi -> token không hợp lệ.
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 1 });
    (mockJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    const req: any = { headers: { authorization: 'Bearer bad-token' } };
    await controller.getOne(1, req);

    // Token lỗi thì chỉ trả dữ liệu sản phẩm, tuyệt đối không ghi activity sai user.
    expect(mockProductService.findById).toHaveBeenCalledWith(1);
    expect(mockProductService.logProductView).not.toHaveBeenCalled();
  });

  it('TC-USER-PRODUCT-CONTROLLER-007 - should not throw when logProductView fails', async () => {
    // Arrange: product lấy thành công nhưng log view bị reject (lỗi phụ).
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 1 });
    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 5 });
    (mockProductService.logProductView as jest.Mock).mockRejectedValue(new Error('log fail'));

    const req: any = { headers: { authorization: 'Bearer token' } };

    // Dù logging lỗi, API chi tiết sản phẩm vẫn phải thành công để không ảnh hưởng trải nghiệm người dùng.
    await expect(controller.getOne(1, req)).resolves.toEqual({ id: 1 });
    expect(mockProductService.findById).toHaveBeenCalledWith(1);
  });

  it('TC-USER-PRODUCT-CONTROLLER-008 - should not log when Authorization header is invalid format', async () => {
    // Authorization không đúng format (không phải Bearer) -> không log view.
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 2 });

    const req: any = { headers: { authorization: 'Basic abc' } };
    const result = await controller.getOne(2, req);

    expect(mockProductService.findById).toHaveBeenCalledWith(2);
    expect(mockProductService.logProductView).not.toHaveBeenCalled();
    expect(mockJwt.verify).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 2 });
  });

  it('TC-USER-PRODUCT-CONTROLLER-009 - should not log when cookie missing token', async () => {
    // Cookie có dữ liệu khác nhưng thiếu token -> không log view.
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 3 });

    const req: any = { headers: { cookie: 'session=abc; theme=dark' } };
    const result = await controller.getOne(3, req);

    expect(mockProductService.findById).toHaveBeenCalledWith(3);
    expect(mockProductService.logProductView).not.toHaveBeenCalled();
    expect(mockJwt.verify).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 3 });
  });

  it('TC-USER-PRODUCT-CONTROLLER-010 - should not log when payload sub is not numeric', async () => {
    // sub không parse được -> extractUserId trả null, không log.
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 4 });
    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 'abc' });

    const req: any = { headers: { authorization: 'Bearer token123' } };
    const result = await controller.getOne(4, req);

    expect(mockProductService.findById).toHaveBeenCalledWith(4);
    expect(mockProductService.logProductView).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 4 });
  });

  it('TC-USER-PRODUCT-CONTROLLER-011 - should bubble error when service.findById fails', async () => {
    // Nếu service ném lỗi (không tìm thấy hoặc DB lỗi), controller phải reject để framework map ra 4xx/5xx.
    (mockProductService.findById as jest.Mock).mockRejectedValue(new Error('not found'));

    const req: any = { headers: { authorization: 'Bearer token123' } };

    await expect(controller.getOne(99, req)).rejects.toThrow('not found');
    expect(mockProductService.findById).toHaveBeenCalledWith(99);
    expect(mockProductService.logProductView).not.toHaveBeenCalled();
  });
});
