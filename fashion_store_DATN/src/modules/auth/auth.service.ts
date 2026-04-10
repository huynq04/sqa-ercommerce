import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '@modules/user/services/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { User } from '@modules/user/entities/user.entity';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { Role } from '@modules/auth/role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForgotPasswordDto } from '@modules/auth/dto/forgotpassword.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ResetPasswordDto } from '@modules/auth/dto/resetpassword.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
  ) {}

  /**
   * Đăng nhập - xác thực user bằng email + password
   */
  async signIn(email: string, password: string) {
    const user: User = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Tài khoản chưa xác thực');
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new ForbiddenException('Tài khoản bị khóa tạm thời');
    }
    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.loginFailedCount += 1;

      if (user.loginFailedCount >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.userRepo.save(user);
      throw new UnauthorizedException('Sai mật khẩu');
    }
    user.loginFailedCount = 0;
    user.lockUntil = null;
    await this.userRepo.save(user);

    // Payload JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      address: user.address,
      avatar: user.avatarUrl,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    // const accessToken = await this.jwtService.signAsync(payload, {
    //   expiresIn: '15m',
    // });

    // const refreshToken = await this.jwtService.signAsync(payload, {
    //   expiresIn: '7d',
    // });
    // Lưu token vào Redis
    const redisKey = `userToken:${user.id}`;
    await this.cacheManager.set(redisKey, accessToken, { ttl: 60 * 60 * 24 }); // TTL 24h

    return { access_token: accessToken };
  }

  async refresh(userId: number, token: string) {
    const saved = await this.cacheManager.get<string>(`refresh:${userId}`);
    if (!saved || saved !== token) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    return {
      accessToken: await this.jwtService.signAsync(
        { sub: userId },
        { expiresIn: '15m' },
      ),
    };
  }
  /** Đăng ký tài khoản mới */
  async register(dto: RegisterDto) {
    // Kiểm tra dữ liệu truyền vào
    if (!dto.email || !dto.phone) {
      throw new ConflictException('Email và SĐT là bắt buộc');
    }
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });
    if (existing) throw new ConflictException('Email hoặc SĐT đã tồn tại');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      passwordHash: hashedPassword,
      role: Role.USER,
      isVerified: false,
    });
    const usertmp = await this.userRepo.save(user);
    await this.sendOtp(user);
    return usertmp;
  }

  async sendOtp(user: User) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    user.otpAttempts = 0;

    await this.userRepo.save(user);
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Mã OTP xác thực tài khoản',
      html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Xin chào ${user.name},</h2>

      <p>Bạn đã yêu cầu xác thực tài khoản / đặt lại mật khẩu.</p>

      <p>
        <b>Mã OTP của bạn là:</b>
      </p>

      <div style="
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 4px;
        margin: 16px 0;
        color: #2c3e50;
      ">
        ${otp}
      </div>

      <p>
        Mã OTP có hiệu lực trong <b>5 phút</b>.
      </p>

      <p>
        Nếu bạn <b>không thực hiện yêu cầu này</b>, vui lòng bỏ qua email này
        hoặc liên hệ bộ phận hỗ trợ.
      </p>

      <hr />

      <p style="font-size: 12px; color: #888;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>
    </div>
  `,
    });
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException();

    if (user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP hết hạn');
    }

    if (user.otpAttempts >= 5) {
      throw new ForbiddenException('OTP bị khóa');
    }

    if (user.otpCode !== otp) {
      user.otpAttempts += 1;
      await this.userRepo.save(user);
      throw new BadRequestException('OTP sai');
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;

    await this.userRepo.save(user);

    return { message: 'Xác thực thành công' };
  }

  /* ================= FORGOT PASSWORD ================= */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException();

    await this.sendOtp(user);
    return { message: 'OTP reset mật khẩu đã gửi' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    await this.verifyOtp(dto.email, dto.otp);

    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);

    return { message: 'Đổi mật khẩu thành công' };
  }

  async logout(userId: number) {
    await this.cacheManager.del(`refresh:${userId}`);
    return { message: 'Logout thành công' };
  }
}
