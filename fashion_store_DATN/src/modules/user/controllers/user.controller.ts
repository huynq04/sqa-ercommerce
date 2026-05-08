import { Controller, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { RolesGuard } from '@modules/auth/roles.guard';
import { Roles } from '@modules/auth/roles.decorator';
import { UsersService } from '@modules/user/services/user.service';
import { Role } from '@modules/auth/role.enum';
import { AuthGuard } from '@modules/auth/auth.guard';
import { UpgradeUserDto } from '@modules/user/dto/upgrade-user.dto';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { UpdateProfileDto } from '@modules/user/dto/update-profile.dto';
import { ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Admin nâng cấp quyền người dùng */
  @ApiBearerAuth()
  @Patch('upgrade')
  @Roles(Role.ADMIN)
  async upgradeUser(@Body(new ValidationPipe()) body: UpgradeUserDto) {
    return this.usersService.upgradeRole(body.userId, body.role);
  }

  /** Admin cập nhật thông tin người dùng */
  @ApiBearerAuth()
  @Patch('update')
  @Roles(Role.ADMIN)
  async updateUser(@Body(new ValidationPipe()) body: UpdateUserDto) {
    return this.usersService.updateUser(body);
  }

  /** User t? c?p nh?t th?ng tin c?a ch?nh m?nh */
  @ApiBearerAuth()
  @Patch('me')
  async updateMe(@Req() req, @Body(new ValidationPipe()) body: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.sub, body);
  }
}

