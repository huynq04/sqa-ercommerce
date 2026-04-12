import { Test, TestingModule } from '@nestjs/testing';
import { UserRecommendationController } from '../controllers/user-recommendation.controller';
import { RecommendationService } from './recommendation.service';

describe('UserRecommendationController', () => {
  let controller: UserRecommendationController;
  const mockService: any = { getRecommendations: jest.fn() };

  beforeEach(async () => {
    controller = new UserRecommendationController(mockService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TC-USER-RECOMMENDATION-CONTROLLER-001 - list calls service with parsed limit', async () => {
    // TC-USER-RECOMMENDATION-CONTROLLER-001: list calls service with parsed limit
    // Arrange: setup mock data / input
    // CheckDB: mocked - no DB touch
    // Act: call function
    // Assert: verify output and behavior
    // Rollback: mocked - nothing to rollback
    // Arrange
    mockService.getRecommendations.mockResolvedValue([1, 2, 3]);
    const req: any = { user: { sub: 42 } };
    // Act
    const res = await controller.list(req, '2');
    // Assert
    expect(mockService.getRecommendations).toHaveBeenCalledWith(42, 2);
    expect(res).toEqual([1, 2, 3]);
  });

  it('TC-USER-RECOMMENDATION-CONTROLLER-002 - propagates service errors', async () => {
    // TC-USER-RECOMMENDATION-CONTROLLER-002: should propagate errors from service
    mockService.getRecommendations.mockRejectedValue(new Error('svc fail'));
    const req: any = { user: { sub: 42 } };
    await expect(controller.list(req, '2')).rejects.toThrow('svc fail');
  });

  // TC-USER-RECOMMENDATION-CONTROLLER-003: uses default limit when query limit missing
  it('TC-USER-RECOMMENDATION-CONTROLLER-003 - list uses default limit 8 when limit is missing', async () => {
    // Arrange: mock service return and request user
    // CheckDB: mocked - no DB touch
    // Act: call list without limit
    // Assert: service called with default limit 8
    // Rollback: mocked - nothing to rollback
    mockService.getRecommendations.mockResolvedValue([]);
    const req: any = { user: { sub: 99 } };

    await controller.list(req);

    expect(mockService.getRecommendations).toHaveBeenCalledWith(99, 8);
  });

  // TC-USER-RECOMMENDATION-CONTROLLER-004: invalid non-numeric limit falls back to 8
  it('TC-USER-RECOMMENDATION-CONTROLLER-004 - list uses default limit 8 for non-numeric limit', async () => {
    // Arrange: mock service return
    // CheckDB: mocked - no DB touch
    // Act: call list with NaN limit
    // Assert: fallback limit is 8
    // Rollback: mocked - nothing to rollback
    mockService.getRecommendations.mockResolvedValue([]);
    const req: any = { user: { sub: 7 } };

    await controller.list(req, 'abc');

    expect(mockService.getRecommendations).toHaveBeenCalledWith(7, 8);
  });

  // TC-USER-RECOMMENDATION-CONTROLLER-005: zero/negative limit falls back to 8
  it('TC-USER-RECOMMENDATION-CONTROLLER-005 - list uses default limit 8 for non-positive limit', async () => {
    // Arrange: mock service return
    // CheckDB: mocked - no DB touch
    // Act: call list with zero and negative limits
    // Assert: both calls fallback to 8
    // Rollback: mocked - nothing to rollback
    mockService.getRecommendations.mockResolvedValue([]);
    const req: any = { user: { sub: 15 } };

    await controller.list(req, '0');
    await controller.list(req, '-5');

    expect(mockService.getRecommendations).toHaveBeenNthCalledWith(1, 15, 8);
    expect(mockService.getRecommendations).toHaveBeenNthCalledWith(2, 15, 8);
  });
});
