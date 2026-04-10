import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@modules/auth/auth.guard';
import { RecommendationService } from '@modules/ecommerce/services/recommendation.service';
import { Product } from '@modules/ecommerce/entities/product.entity';

@ApiTags('User/Recommendations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('recommendations')
export class UserRecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
  ) {}

  @Get()
  @ApiOkResponse({ type: [Product] })
  async list(@Req() req, @Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 8;
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 8;

    return this.recommendationService.getRecommendations(
      req.user.sub,
      safeLimit,
    );
  }
}
