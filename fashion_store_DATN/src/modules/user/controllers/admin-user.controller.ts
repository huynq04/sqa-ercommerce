import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Body,
  Delete,
  UseGuards,
  ValidationPipe,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from '@modules/user/services/user.service';
import { AuthGuard } from '@modules/auth/auth.guard';
import { RolesGuard } from '@modules/auth/roles.guard';
import { Roles } from '@modules/auth/roles.decorator';
import { Role } from '@modules/auth/role.enum';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { CreateStaffUserDto } from '@modules/user/dto/create-staff-user.dto';

@ApiTags('Admin/Users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  getUsers(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('role') role?: string,
  ) {
    const requesterRole = req.user?.role;
    const roleFilter = requesterRole === Role.STAFF ? Role.USER : role;
    return this.usersService.findPaged({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort,
      role: roleFilter,
    });
  }

  @Roles(Role.ADMIN)
  @Post('staff/create')
  async createStaffUser(@Body(new ValidationPipe()) body: CreateStaffUserDto) {
    return this.usersService.createStaffUser(body);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id')
  async getUser(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    if (req.user?.role === Role.STAFF && user.role !== Role.USER) {
      throw new ForbiddenException('Khong du quyen');
    }
    return user;
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch('update')
  async updateUser(@Req() req, @Body(new ValidationPipe()) body: UpdateUserDto) {
    if (req.user?.role === Role.STAFF) {
      const target = await this.usersService.findById(body.id);
      if (target.role !== Role.USER) {
        throw new ForbiddenException('Khong du quyen');
      }
      if (body.role && body.role !== Role.USER) {
        throw new ForbiddenException('Khong du quyen');
      }
    }
    return this.usersService.updateUser(body);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  async deleteUser(@Req() req, @Param('id', ParseIntPipe) id: number) {
    if (req.user?.role === Role.STAFF) {
      const target = await this.usersService.findById(id);
      if (target.role !== Role.USER) {
        throw new ForbiddenException('Khong du quyen');
      }
    }
    return this.usersService.deleteUser(id);
  }
}
