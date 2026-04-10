import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@modules/user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Role } from '@modules/auth/role.enum';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { CreateStaffUserDto } from '@modules/user/dto/create-staff-user.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgotpassword.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // /** Đăng ký tài khoản mới */
  // async createUser(dto: RegisterDto): Promise<User> {
  //   // Kiểm tra dữ liệu truyền vào
  //   if (!dto.email || !dto.phone) {
  //     throw new ConflictException('Email và SĐT là bắt buộc');
  //   }
  //   const existing = await this.userRepo.findOne({
  //     where: [{ email: dto.email }, { phone: dto.phone }],
  //   });
  //   if (existing) throw new ConflictException('Email hoặc SĐT đã tồn tại');
  //
  //   const hashedPassword = await bcrypt.hash(dto.password, 10);
  //
  //   const user = this.userRepo.create({
  //     name: dto.name,
  //     email: dto.email,
  //     phone: dto.phone,
  //     address: dto.address,
  //     passwordHash: hashedPassword,
  //     role: Role.USER,
  //     isVerified: false,
  //   });
  //   return this.userRepo.save(user);
  // }

  /** Tìm user theo email */
  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  /** Tìm user theo ID */
  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy user');
    return user;
  }

  /** Nâng cấp quyền */
  async upgradeRole(id: number, role: Role): Promise<User> {
    const user = await this.findById(id);
    user.role = role;
    return this.userRepo.save(user);
  }

  /** Cập nhật thông tin user (Admin update) */
  async updateUser(data: UpdateUserDto): Promise<User> {
    const user = await this.findById(data.id);

    // Gán lại các giá trị
    Object.assign(user, {
      name: data.name ?? user.name,
      email: data.email ?? user.email,
      phone: data.phone ?? user.phone,
      address: data.address ?? user.address,
      role: data.role ?? user.role,
      avatarUrl: data.avatarUrl ?? user.avatarUrl,
    });

    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.userRepo.save(user);
  }

  async createStaffUser(dto: CreateStaffUserDto): Promise<User> {
    if (!dto.email || !dto.phone) {
      throw new ConflictException('Email va SDT là bắt buộc');
    }
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });
    if (existing) {
      throw new ConflictException('Email hoặc SDT đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      passwordHash: hashedPassword,
      role: Role.STAFF,
      isVerified: true,
    });

    return this.userRepo.save(user);
  }


  /** C?p nh?t th?ng tin c?a ch?nh user */
  async updateProfile(userId: number, data: {
    name?: string;
    phone?: string;
    address?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const user = await this.findById(userId);

    Object.assign(user, {
      name: data.name ?? user.name,
      phone: data.phone ?? user.phone,
      address: data.address ?? user.address,
      avatarUrl: data.avatarUrl ?? user.avatarUrl,
    });

    return this.userRepo.save(user);
  }

  /** Lấy tất cả người dùng */
  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  /** Tìm user có sinh nhật hôm nay (dạng Date MySQL) */
  async findUsersWithBirthday(today: Date): Promise<User[]> {
    const month = today.getMonth() + 1;
    const day = today.getDate();

    return this.userRepo
      .createQueryBuilder('user')
      .where('MONTH(user.createdAt) = :month', { month })
      .andWhere('DAY(user.createdAt) = :day', { day })
      .getMany();
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.remove(user);
    return { message: 'Đã xóa người dùng thành công' };
  }

  async findPaged(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    role?: string;
  }): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit =
      params?.limit && params.limit > 0 && params.limit <= 100
        ? params.limit
        : 10;

    const qb = this.userRepo.createQueryBuilder('user');

    if (params?.role) {
      qb.andWhere('user.role = :role', { role: params.role });
    }

    const allowedSortFields = new Set([
      'id',
      'createdAt',
      'updatedAt',
      'name',
      'email',
      'phone',
      'role',
      'isVerified',
    ]);

    const sort =
      params?.sort
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean) ?? [];
    if (sort.length > 0) {
      sort.forEach((token, index) => {
        const direction = token.startsWith('-') ? 'DESC' : 'ASC';
        const field = token.replace(/^[-+]/, '');
        if (!allowedSortFields.has(field)) return;
        if (index === 0) {
          qb.orderBy(`user.${field}`, direction);
        } else {
          qb.addOrderBy(`user.${field}`, direction);
        }
      });
    } else {
      qb.orderBy('user.createdAt', 'DESC');
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }
}
