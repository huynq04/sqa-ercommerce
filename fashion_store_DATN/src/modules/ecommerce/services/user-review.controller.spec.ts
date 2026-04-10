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

  it('// TC-user-review-controller-001: create calls service with user id', async () => {
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

  it('// TC-user-review-controller-002: listProductReviews forwards params', async () => {
    // Arrange
    mockService.listProductReviews.mockResolvedValue({ items: [] });
    const query: any = {};
    // Act
    const res = await controller.listProductReviews(11, query);
    // Assert
    expect(mockService.listProductReviews).toHaveBeenCalledWith(11, query);
  });

  it('// TC-user-review-controller-003: check forwards user and orderItemId', async () => {
    // Arrange
    const req: any = { user: { sub: 8 } };
    mockService.checkCommentable.mockResolvedValue({ canComment: true });
    // Act
    const res = await controller.check(req, 5);
    // Assert
    expect(mockService.checkCommentable).toHaveBeenCalledWith(8, 5);
  });
});