import { Test, TestingModule } from '@nestjs/testing';
import { UserReviewController } from '../controllers/user-review.controller';
import { UserReviewService } from './user-review.service';

describe('UserReviewController', () => {
  let controller: UserReviewController;
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
    // TC-USER-REVIEW-CONTROLLER-001: create calls service with user id
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    const dto = { orderItemId: 1 } as any;
    const req: any = { user: { sub: 7 } };
    mockService.createReview.mockResolvedValue({ id: 9 });
    // Act
    const res = await controller.create(req, dto);
    // Assert
    expect(mockService.createReview).toHaveBeenCalledWith(7, dto);
    expect(res).toEqual({ id: 9 });
  });

  it('TC-USER-REVIEW-CONTROLLER-002 - listProductReviews forwards params', async () => {
    // TC-USER-REVIEW-CONTROLLER-002: listProductReviews forwards params
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    mockService.listProductReviews.mockResolvedValue({ items: [] });
    const query: any = {};
    // Act
    const res = await controller.listProductReviews(11, query);
    // Assert
    expect(mockService.listProductReviews).toHaveBeenCalledWith(11, query);
  });

  it('TC-USER-REVIEW-CONTROLLER-003 - check forwards user and orderItemId', async () => {
    // TC-USER-REVIEW-CONTROLLER-003: check forwards user and orderItemId
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    const req: any = { user: { sub: 8 } };
    mockService.checkCommentable.mockResolvedValue({ canComment: true });
    // Act
    const res = await controller.check(req, 5);
    // Assert
    expect(mockService.checkCommentable).toHaveBeenCalledWith(8, 5);
  });

  it('TC-USER-REVIEW-CONTROLLER-004 - create propagates service errors', async () => {
    // TC-USER-REVIEW-CONTROLLER-004: create should propagate errors from service
    const dto = { orderItemId: 1 } as any;
    const req: any = { user: { sub: 7 } };
    mockService.createReview.mockRejectedValue(new Error('create fail'));
    await expect(controller.create(req, dto)).rejects.toThrow('create fail');
  });

  it('TC-USER-REVIEW-CONTROLLER-005 - listProductReviews propagates errors', async () => {
    // TC-USER-REVIEW-CONTROLLER-005: listProductReviews should propagate errors
    mockService.listProductReviews.mockRejectedValue(new Error('paginate fail'));
    await expect(controller.listProductReviews(11, {} as any)).rejects.toThrow('paginate fail');
  });

  it('TC-USER-REVIEW-CONTROLLER-006 - check propagates errors', async () => {
    // TC-USER-REVIEW-CONTROLLER-006: check should propagate errors
    const req: any = { user: { sub: 8 } };
    mockService.checkCommentable.mockRejectedValue(new Error('check fail'));
    await expect(controller.check(req, 5)).rejects.toThrow('check fail');
  });
});