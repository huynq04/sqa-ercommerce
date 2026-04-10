import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@modules/auth/auth.guard';
import { RolesGuard } from '@modules/auth/roles.guard';
import { Roles } from '@modules/auth/roles.decorator';
import { Role } from '@modules/auth/role.enum';
import { AdminReviewService } from '@modules/ecommerce/services/admin-review.service';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';
import { SellerReplyReviewDto } from '@modules/ecommerce/dtos/review.dto';

@ApiTags('Admin/Reviews')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/reviews')
export class AdminReviewController {
  constructor(private readonly reviewService: AdminReviewService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  list(@Query() query: QuerySpecificationDto) {
    return this.reviewService.listAll(query);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id/reply')
  reply(
    @Param('id', ParseIntPipe) reviewId: number,
    @Body() dto: SellerReplyReviewDto,
  ) {
    return this.reviewService.reply(reviewId, dto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.getById(id);
  }
}
