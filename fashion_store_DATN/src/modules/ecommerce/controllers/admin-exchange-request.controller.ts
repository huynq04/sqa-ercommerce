import { Controller, Patch, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@modules/auth/auth.guard';
import { RolesGuard } from '@modules/auth/roles.guard';
import { Roles } from '@modules/auth/roles.decorator';
import { Role } from '@modules/auth/role.enum';
import { ReasonDto } from '@modules/ecommerce/dtos/return-exchange.dto';
import { AdminExchangeRequestService } from '@modules/ecommerce/services/admin-exchange-request.service';

@ApiTags('Admin/Requests')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/requests')
export class AdminExchangeRequestController {
  constructor(private readonly service: AdminExchangeRequestService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('return/:id')
  getReturnById(@Param('id') id: number) {
    return this.service.getReturnById(id);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch('return/:id/approve')
  approveReturn(@Param('id') id: number) {
    return this.service.approveReturn(id);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch('return/:id/reject')
  rejectReturn(@Param('id') id: number, @Body() dto: ReasonDto) {
    return this.service.rejectReturn(id, dto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch('return/:id/receive')
  receiveReturn(@Param('id') id: number) {
    return this.service.receiveReturn(id);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch('return/:id/complete')
  completeReturn(@Param('id') id: number) {
    return this.service.completeReturn(id);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('returns')
  listAllReturns() {
    return this.service.listAllReturns();
  }
}
