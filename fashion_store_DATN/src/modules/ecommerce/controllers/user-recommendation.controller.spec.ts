import { UserRecommendationController } from './user-recommendation.controller';

describe('UserRecommendationController', () => {
  let controller: UserRecommendationController;
  // Mock service gợi ý sản phẩm để tập trung test parsing/forwarding của controller.
  const mockService: any = { getRecommendations: jest.fn() };
  const defaultLimit = 8;

  beforeEach(() => {
    controller = new UserRecommendationController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-USER-RECOMMENDATION-CONTROLLER-001 - list calls service with parsed limit', async () => {
    // Arrange: req chứa userId và limit truyền vào ở dạng string từ query params.
    const req: any = { user: { sub: 42 } };
    mockService.getRecommendations.mockResolvedValue([1, 2]);

    // Act
    const result = await controller.list(req, '2');

    // Assert: limit phải được parse về number trước khi gọi service.
    expect(mockService.getRecommendations).toHaveBeenCalledWith(42, 2);
    expect(result).toEqual([1, 2]);
  });

  it('TC-USER-RECOMMENDATION-CONTROLLER-002 - list uses default limit 8 when limit is missing', async () => {
    // Arrange: không truyền limit.
    const req: any = { user: { sub: 7 } };
    mockService.getRecommendations.mockResolvedValue([]);

    // Act
    await controller.list(req);

    // Assert: controller phải fallback về limit mặc định = 8.
    expect(mockService.getRecommendations).toHaveBeenCalledWith(7, defaultLimit);
  });

  it('TC-USER-RECOMMENDATION-CONTROLLER-003 - list uses default limit 8 for non-positive limit', async () => {
    // Arrange: các giá trị không hợp lệ (không phải số / <= 0).
    const req: any = { user: { sub: 9 } };
    mockService.getRecommendations.mockResolvedValue([]);

    // Act
    await controller.list(req, 'abc');
    await controller.list(req, '0');

    // Assert: cả 2 lần đều phải dùng default 8 để đảm bảo an toàn.
    expect(mockService.getRecommendations).toHaveBeenNthCalledWith(1, 9, defaultLimit);
    expect(mockService.getRecommendations).toHaveBeenNthCalledWith(2, 9, defaultLimit);
  });

  it('TC-USER-RECOMMENDATION-CONTROLLER-004 - list uses default limit 8 for empty string', async () => {
    // Arrange: limit rỗng -> Number('') = 0, phải fallback.
    const req: any = { user: { sub: 10 } };
    mockService.getRecommendations.mockResolvedValue([]);

    // Act
    await controller.list(req, '');

    // Assert
    expect(mockService.getRecommendations).toHaveBeenCalledWith(10, defaultLimit);
  });

  it('TC-USER-RECOMMENDATION-CONTROLLER-005 - list propagates service errors (fail case)', async () => {
    // Arrange: service lỗi, controller phải throw lại để global filter xử lý.
    const req: any = { user: { sub: 12 } };
    mockService.getRecommendations.mockRejectedValue(new Error('service-failed'));

    // Act + Assert
    await expect(controller.list(req, '5')).rejects.toThrow('service-failed');
  });
});
