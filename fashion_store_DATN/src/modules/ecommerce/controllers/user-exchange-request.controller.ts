import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@modules/auth/auth.guard';
import { CreateReturnDto } from '@modules/ecommerce/dtos/return-exchange.dto';
import { UserExchangeRequestService } from '@modules/ecommerce/services/user-exchange-request.service';

@ApiTags('User Requests')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('user/requests')
export class UserExchangeRequestController {
  constructor(private readonly service: UserExchangeRequestService) {}

  @Post('return')
  createReturn(@Body() dto: CreateReturnDto, @Req() req) {
    return this.service.createReturn(dto, req.user.sub);
  }

  @Get('returns')
  listReturns(@Req() req) {
    return this.service.listUserExchanges(req.user.sub);
  }
}
