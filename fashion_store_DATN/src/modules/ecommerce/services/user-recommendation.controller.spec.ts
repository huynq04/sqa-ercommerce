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

  it('// TC-user-recommendation-controller-001: list calls service with parsed limit', async () => {
    // Arrange
    mockService.getRecommendations.mockResolvedValue([1, 2, 3]);
    const req: any = { user: { sub: 42 } };
    // Act
    const res = await controller.list(req, '2');
    // Assert
    expect(mockService.getRecommendations).toHaveBeenCalledWith(42, 2);
    expect(res).toEqual([1, 2, 3]);
  });
});