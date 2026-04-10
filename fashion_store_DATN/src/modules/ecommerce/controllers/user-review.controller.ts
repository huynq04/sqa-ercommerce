import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@modules/auth/auth.guard';
import { UserReviewService } from '@modules/ecommerce/services/user-review.service';
import { CreateProductReviewDto } from '@modules/ecommerce/dtos/review.dto';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';

@ApiTags('User/Reviews')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('reviews')
export class UserReviewController {
  constructor(private readonly reviewService: UserReviewService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateProductReviewDto) {
    return this.reviewService.createReview(req.user.sub, dto);
  }

  @Get('product/:productId')
  listProductReviews(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: QuerySpecificationDto,
  ) {
    return this.reviewService.listProductReviews(productId, query);
  }

  @Get('order-items/:orderItemId/check')
  check(@Req() req, @Param('orderItemId', ParseIntPipe) orderItemId: number) {
    return this.reviewService.checkCommentable(req.user.sub, orderItemId);
  }
}
