import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@modules/auth/auth.guard';
import { RolesGuard } from '@modules/auth/roles.guard';
import { Roles } from '@modules/auth/roles.decorator';
import { Role } from '@modules/auth/role.enum';
import { AdminReportService } from '../services/admin-report.service';
import { BestSellerFilterDto, ReportFilterDto } from '../dtos/report.dto';

@ApiTags('Admin/Reports')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/reports')
export class AdminReportController {
  constructor(private readonly reportService: AdminReportService) {}

  @Roles(Role.ADMIN)
  @Get('overview')
  getOverview(@Query() filter: ReportFilterDto) {
    return this.reportService.getRevenueOverview(filter);
  }

  @Roles(Role.ADMIN)
  @Get('best-sellers')
  getBestSellers(@Query() filter: BestSellerFilterDto) {
    return this.reportService.getBestSellerProducts(filter);
  }

  @Roles(Role.ADMIN)
  @Get('product-sales')
  getProductSales(@Query() filter: ReportFilterDto) {
    return this.reportService.getProductSales(filter);
  }

  @Roles(Role.ADMIN)
  @Get('revenue-by-month')
  getRevenueByMonth(@Query() filter: ReportFilterDto) {
    return this.reportService.getMonthlyRevenue(filter);
  }
}
