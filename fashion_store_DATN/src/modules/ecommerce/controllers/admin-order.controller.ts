import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@modules/auth/roles.decorator';
import { RolesGuard } from '@modules/auth/roles.guard';
import { Role } from '@modules/auth/role.enum';
import { AuthGuard } from '@modules/auth/auth.guard';
import { AdminOrderService } from '../services/admin-order.service';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';

@ApiTags('Admin/Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly orderService: AdminOrderService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  list(@Query() query: QuerySpecificationDto) {
    return this.orderService.listAll(query);
  }
}
