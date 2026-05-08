import { UserReviewController } from '../controllers/user-review.controller';

describe('UserReviewController', () => {
  let controller: UserReviewController;
  // Mock service cho các action liên quan review.
  const mockService: any = {
    createReview: jest.fn(),
    listProductReviews: jest.fn(),
    checkCommentable: jest.fn(),
  };

  beforeEach(() => {
    controller = new UserReviewController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-USER-REVIEW-CONTROLLER-001 - create calls service with user id', async () => {
    // Arrange: req.user.sub là userId được guard gắn vào request.
    const req: any = { user: { sub: 7 } };
    const dto = { orderItemId: 1 } as any;
    mockService.createReview.mockResolvedValue({ id: 9 });

    // Act
    const result = await controller.create(req, dto);

    // Assert: controller phải truyền userId + dto sang service.createReview.
    expect(mockService.createReview).toHaveBeenCalledWith(7, dto);
    expect(result).toEqual({ id: 9 });
  });

  it('TC-USER-REVIEW-CONTROLLER-002 - create should bubble error from service', async () => {
    const req: any = { user: { sub: 7 } };
    mockService.createReview.mockRejectedValue(new Error('create fail'));

    await expect(controller.create(req, { orderItemId: 1 } as any)).rejects.toThrow(
      'create fail',
    );
  });

  it('TC-USER-REVIEW-CONTROLLER-003 - listProductReviews forwards params', async () => {
    // Arrange: productId và query phân trang/lọc.
    const query = { page: 1 } as any;
    mockService.listProductReviews.mockResolvedValue({ items: [], total: 0 });

    // Act
    const result = await controller.listProductReviews(11, query);

    // Assert: phải forward đúng cả productId lẫn query object.
    expect(mockService.listProductReviews).toHaveBeenCalledWith(11, query);
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('TC-USER-REVIEW-CONTROLLER-004 - listProductReviews forwards undefined query', async () => {
    mockService.listProductReviews.mockResolvedValue({ items: [], total: 0 });

    const result = await controller.listProductReviews(11, undefined as any);

    expect(mockService.listProductReviews).toHaveBeenCalledWith(11, undefined);
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('TC-USER-REVIEW-CONTROLLER-005 - listProductReviews should bubble error from service', async () => {
    mockService.listProductReviews.mockRejectedValue(new Error('list fail'));

    await expect(
      controller.listProductReviews(11, { page: 1 } as any),
    ).rejects.toThrow('list fail');
  });

  it('TC-USER-REVIEW-CONTROLLER-006 - check forwards user and orderItemId', async () => {
    // Arrange: req.user.sub dùng để kiểm tra quyền comment theo orderItem.
    const req: any = { user: { sub: 8 } };
    mockService.checkCommentable.mockResolvedValue({ canComment: true });

    // Act
    const result = await controller.check(req, 5);

    // Assert
    expect(mockService.checkCommentable).toHaveBeenCalledWith(8, 5);
    expect(result).toEqual({ canComment: true });
  });

  it('TC-USER-REVIEW-CONTROLLER-007 - check should bubble error from service', async () => {
    const req: any = { user: { sub: 8 } };
    mockService.checkCommentable.mockRejectedValue(new Error('check fail'));

    await expect(controller.check(req, 5)).rejects.toThrow('check fail');
  });
});
