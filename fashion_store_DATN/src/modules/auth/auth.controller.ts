import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  Request,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '@modules/user/services/user.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from './role.enum';
import { MailerService } from '@nestjs-modules/mailer';
import { Cron } from '@nestjs/schedule';
import { SignInDto } from '@modules/auth/dto/signin.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ForgotPasswordDto } from '@modules/auth/dto/forgotpassword.dto';
import { ResetPasswordDto } from '@modules/auth/dto/resetpassword.dto';
import { VerifyOtpDto } from '@modules/auth/dto/verifyotp.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
  ) {}

  // --- LOGIN ---
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  // --- REGISTER ---
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-otp')
  verify(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('refresh')
  refresh(@Req() req) {
    return this.authService.refresh(req.user.sub, req.user.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Req() req) {
    return this.authService.logout(req.user.sub);
  }

  // --- PROFILE ---
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  // --- SEND BIRTHDAY EMAIL (Admin only, optional if User has birthday column) ---
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('mail')
  async sendBirthdayMail() {
    // ⚠️ Nếu User entity chưa có "birthday", bạn có thể bỏ phần này
    const today = new Date();
    const users = await this.usersService.findUsersWithBirthday(today);

    if (users.length === 0) {
      return 'Không có user sinh nhật hôm nay';
    }

    for (const user of users) {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Chúc mừng sinh nhật 🎉',
        html: `<b>Chúc ${user.name} sinh nhật vui vẻ nhé! 🎂</b>`,
      });
    }

    return `${users.length} người dùng đã được chúc mừng sinh nhật.`;
  }

  // --- CRON JOB: chạy tự động mỗi sáng 10:00 ---
  @Cron('0 10 * * *')
  async sendBirthdayMailCron() {
    console.log('Cron job gửi email sinh nhật chạy lúc 10:00 sáng');
    await this.sendBirthdayMail();
  }
}
