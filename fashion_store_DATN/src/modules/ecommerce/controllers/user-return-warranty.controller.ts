// import {
//   Controller,
//   Post,
//   Patch,
//   Get,
//   Body,
//   Param,
//   Req,
//   UseGuards,
// } from '@nestjs/common';
// import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
// import { AuthGuard } from '@modules/auth/auth.guard';
// import { UserReturnWarrantyService } from '@modules/ecommerce/services/user-return-warranty.service';
// import {
//   CreateReturnDto,
//   CreateWarrantyDto,
// } from '@modules/ecommerce/dtos/return-exchange.dto';
//
// @ApiTags('User Requests')
// @ApiBearerAuth()
// @UseGuards(AuthGuard)
// @Controller('user/requests')
// export class UserReturnWarrantyController {
//   constructor(private readonly service: UserReturnWarrantyService) {}
//
//   // ------------------- RETURN -------------------
//   @Post('return')
//   createReturn(@Body() dto: CreateReturnDto, @Req() req) {
//     return this.service.createReturn(dto, req.user.sub);
//   }
//
//   @Patch('return/:id/ship')
//   shipReturn(
//     @Param('id') id: number,
//     @Body('shippingCode') shippingCode: string,
//   ) {
//     return this.service.shipReturn(id, shippingCode);
//   }
//
//   @Get('returns')
//   listReturns(@Req() req) {
//     return this.service.listUserReturns(req.user.sub);
//   }
//
//   // ------------------- WARRANTY -------------------
//   @Post('warranty')
//   createWarranty(@Body() dto: CreateWarrantyDto, @Req() req) {
//     return this.service.createWarranty(dto, req.user.sub);
//   }
//
//   @Patch('warranty/:id/ship')
//   shipWarranty(
//     @Param('id') id: number,
//     @Body('shippingCode') shippingCode: string,
//   ) {
//     return this.service.shipWarranty(id, shippingCode);
//   }
//
//   @Get('warranties')
//   listWarranties(@Req() req) {
//     return this.service.listUserWarranties(req.user.sub);
//   }
// }
