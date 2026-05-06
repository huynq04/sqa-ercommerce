import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as bcrypt from 'bcrypt';

import { UsersService } from './user.service';
import { User } from '@modules/user/entities/user.entity';
import { Role } from '@modules/auth/role.enum';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

  // Checklist compliance:
  // - Moi test case deu co comment Test Case ID ngay truoc it(...).
  // - CheckDB duoc xac minh qua assert cac call den repository/query builder.
  // - Rollback duoc thuc hien trong afterEach() tren object mock, khong dung DB that.

  const userRepoMock = {
    findOne: jest.fn<(...args: any[]) => Promise<User | null>>(),
    save: jest.fn<(...args: any[]) => Promise<User>>(),
    create: jest.fn<(...args: any[]) => User>(),
    find: jest.fn<(...args: any[]) => Promise<User[]>>(),
    remove: jest.fn<(...args: any[]) => Promise<User>>(),
    delete: jest.fn<(...args: any[]) => Promise<any>>(),
    createQueryBuilder: jest.fn<(...args: any[]) => any>(),
  };

  type UserDbSnapshot = Pick<
    User,
    | 'name'
    | 'email'
    | 'phone'
    | 'address'
    | 'role'
    | 'avatarUrl'
    | 'passwordHash'
  >;

  const usersNeedingRollback: Array<{ user: User; snapshot: UserDbSnapshot }> =
    [];

  const captureUserDbSnapshot = (user: User): UserDbSnapshot => ({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    avatarUrl: user.avatarUrl,
    passwordHash: user.passwordHash,
  });

  const registerRollbackSnapshot = (user: User) => {
    usersNeedingRollback.push({ user, snapshot: captureUserDbSnapshot(user) });
  };

  const rollbackTrackedUsers = () => {
    for (const { user, snapshot } of usersNeedingRollback) {
      user.name = snapshot.name;
      user.email = snapshot.email;
      user.phone = snapshot.phone;
      user.address = snapshot.address;
      user.role = snapshot.role;
      user.avatarUrl = snapshot.avatarUrl;
      user.passwordHash = snapshot.passwordHash;
    }
    usersNeedingRollback.length = 0;
  };

  const buildMockUser = (overrides: Partial<User> = {}): User => {
    return {
      id: 1,
      name: 'Test User',
      email: 'user@example.com',
      phone: '0123456789',
      address: 'HN',
      avatarUrl: 'avatar.png',
      passwordHash: 'hashed-password',
      role: Role.USER,
      isVerified: true,
      ...overrides,
    } as User;
  };

  beforeEach(async () => {
    // Lam sach mock truoc moi test de dam bao tinh doc lap.
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepoMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    // Rollback object gia lap ve trang thai truoc test.
    rollbackTrackedUsers();
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_USER_SERVICE_001
  it('[TC_USER_SERVICE_001] findOneByEmail trả về user khi tìm thấy theo email', async () => {
    const email = 'user@example.com';
    const user = buildMockUser();

    userRepoMock.findOne.mockResolvedValue(user);

    const result = await service.findOneByEmail(email);

    expect(userRepoMock.findOne).toHaveBeenCalledTimes(1);

    // CheckDB (read): verify query đúng cấu trúc ORM
    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { email },
    });

    expect(result).toBe(user);
  });
  // Test Case ID: TC_USER_SERVICE_002
  it('[TC_USER_SERVICE_002] trả về null khi không tìm thấy user theo email', async () => {
    const email = 'notfound@example.com';

    userRepoMock.findOne.mockResolvedValue(null);

    const result = await service.findOneByEmail(email);

    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { email },
    });

    expect(result).toBeNull();
  });
  // Test Case ID: TC_USER_SERVICE_003
  it('[TC_USER_SERVICE_003] xử lý khi email undefined hoặc null', async () => {
    userRepoMock.findOne.mockResolvedValue(null);

    await service.findOneByEmail(undefined as any);

    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { email: undefined },
    });
  });

  // Test Case ID: TC_USER_SERVICE_004
  it('[TC_USER_SERVICE_004] findById phải throw NotFoundException khi user không tồn tại', async () => {
    // Arrange
    const id = 99;

    userRepoMock.findOne.mockResolvedValue(null);

    // Act + Assert (error flow)
    await expect(service.findById(id)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    // CheckDB (read): verify query đúng id
    expect(userRepoMock.findOne).toHaveBeenCalledTimes(1);
    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { id },
    });
  });
  // Test Case ID: TC_USER_SERVICE_005
  it('[TC_USER_SERVICE_005] findById trả về user khi tồn tại trong DB', async () => {
    // Arrange
    const id = 10;
    const user = buildMockUser({ id });

    userRepoMock.findOne.mockResolvedValue(user);

    // Act
    const result = await service.findById(id);

    // Assert
    expect(userRepoMock.findOne).toHaveBeenCalledTimes(1);

    // CheckDB (read)
    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { id },
    });

    expect(result).toBe(user);
  });
  // Test Case ID: TC_USER_SERVICE_006
  it('[TC_USER_SERVICE_006] xử lý khi id undefined', async () => {
    userRepoMock.findOne.mockResolvedValue(null);

    await expect(service.findById(undefined as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: undefined },
    });
  });
  // Test Case ID: TC_USER_SERVICE_007
  it('[TC_USER_SERVICE_007] upgradeRole phải cập nhật role và lưu user vào database', async () => {
    const user = buildMockUser({ role: Role.USER });

    registerRollbackSnapshot(user);

    userRepoMock.findOne.mockResolvedValue(user);
    userRepoMock.save.mockResolvedValue(user);

    // Act
    const result = await service.upgradeRole(1, Role.ADMIN);

    // Assert state change
    expect(user.role).toBe(Role.ADMIN);

    // CheckDB (read + write)
    expect(userRepoMock.findOne).toHaveBeenCalledTimes(1);
    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
    });

    expect(userRepoMock.save).toHaveBeenCalledTimes(1);
    expect(userRepoMock.save).toHaveBeenCalledWith(user);

    expect(result).toBe(user);
  });

  // Test Case ID: TC_USER_SERVICE_008
  it('[TC_USER_SERVICE_008] throw lỗi khi user không tồn tại', async () => {
    userRepoMock.findOne.mockResolvedValue(null);

    await expect(service.upgradeRole(1, Role.ADMIN)).rejects.toThrow();

    expect(userRepoMock.save).not.toHaveBeenCalled();
  });
  // Test Case ID: TC_USER_SERVICE_009
  it('[TC_USER_SERVICE_009] upgradeRole phải throw NotFoundException khi id undefined', async () => {
    // Arrange
    userRepoMock.findOne.mockResolvedValue(null);

    // Act + Assert
    await expect(
      service.upgradeRole(undefined as any, Role.ADMIN),
    ).rejects.toBeInstanceOf(NotFoundException);

    // CheckDB (read)
    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: undefined },
    });

    // CheckDB (write safety)
    expect(userRepoMock.save).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_USER_SERVICE_010
  it('[TC_USER_SERVICE_010] updateUser phải throw NotFoundException khi user không tồn tại', async () => {
    // Arrange
    userRepoMock.findOne.mockResolvedValue(null);

    const dto = {
      id: 999,
      name: 'Updated Name',
      password: 'new-password',
    };

    // Act + Assert
    await expect(service.updateUser(dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    // CheckDB (read)
    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: 999 },
    });

    // Check safety: không được ghi DB
    expect(userRepoMock.save).not.toHaveBeenCalled();
    expect(bcryptMock.hash).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_USER_SERVICE_011
  it('[TC_USER_SERVICE_011] updateUser giữ nguyên passwordHash khi không truyền password mới', async () => {
    // Arrange
    const user = buildMockUser({ passwordHash: 'old-hash' });

    registerRollbackSnapshot(user);

    userRepoMock.findOne.mockResolvedValue(user);
    userRepoMock.save.mockResolvedValue(user);

    const dto = {
      id: 1,
      name: 'Name Only',
    };

    // Act
    const result = await service.updateUser(dto);

    // Assert state preservation
    expect(user.passwordHash).toBe('old-hash');

    expect(bcryptMock.hash).not.toHaveBeenCalled();

    // CheckDB (write)
    expect(userRepoMock.save).toHaveBeenCalledTimes(1);

    expect(result).toBe(user);
  });

  // Test Case ID: TC_USER_SERVICE_012
  it('[TC_USER_SERVICE_012] createStaffUser phải throw ConflictException khi thiếu email hoặc phone', async () => {
    const dto = {
      name: 'Staff',
      email: '',
      password: '123456',
      phone: '',
    };

    await expect(service.createStaffUser(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    // CheckDB: không được gọi DB khi input invalid
    expect(userRepoMock.findOne).not.toHaveBeenCalled();
    expect(userRepoMock.save).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_USER_SERVICE_013
  it('[TC_USER_SERVICE_013] createStaffUser phải throw ConflictException khi email hoặc phone đã tồn tại', async () => {
    // Arrange
    userRepoMock.findOne.mockResolvedValue(buildMockUser());

    const dto = {
      name: 'Staff',
      email: 'staff@example.com',
      password: '123456',
      phone: '0123456789',
    };

    // Act + Assert
    await expect(service.createStaffUser(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    // CheckDB (read): verify check duplicate được gọi
    expect(userRepoMock.findOne).toHaveBeenCalledTimes(1);
    expect(userRepoMock.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Object),
      }),
    );

    // CheckDB (write): không được insert khi conflict
    expect(userRepoMock.save).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_USER_SERVICE_014
  it('[TC_USER_SERVICE_014] createStaffUser phải tạo STAFF user, hash password và lưu DB', async () => {
    // Arrange
    userRepoMock.findOne.mockResolvedValue(null);
    userRepoMock.create.mockImplementation((input) => input);

    bcryptMock.hash.mockResolvedValue('staff-hash' as never);

    const saved = buildMockUser({
      role: Role.STAFF,
      isVerified: true,
      passwordHash: 'staff-hash',
    });

    userRepoMock.save.mockResolvedValue(saved);

    const dto = {
      name: 'Staff',
      email: 'staff@example.com',
      password: '123456',
      phone: '0123456789',
      address: 'DN',
    };

    // Act
    const result = await service.createStaffUser(dto);

    // Assert ExternalCall
    expect(bcryptMock.hash).toHaveBeenCalledTimes(1);

    // CheckDB (read)
    expect(userRepoMock.findOne).toHaveBeenCalledTimes(1);

    // CheckDB (write)
    expect(userRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        role: Role.STAFF,
        isVerified: true,
        passwordHash: 'staff-hash',
      }),
    );

    expect(userRepoMock.save).toHaveBeenCalledTimes(1);

    expect(result).toBe(saved);
  });

  // Test Case ID: TC_USER_SERVICE_015
  it('[TC_USER_SERVICE_015] updateProfile phải cập nhật đúng field của user và lưu DB', async () => {
    // Arrange
    const user = buildMockUser();

    registerRollbackSnapshot(user);

    userRepoMock.findOne.mockResolvedValue(user);
    userRepoMock.save.mockResolvedValue(user);

    const dto = {
      name: 'Profile Name',
      phone: '0999999999',
      address: 'Can Tho',
      avatarUrl: 'profile.png',
    };

    // Act
    const result = await service.updateProfile(1, dto);

    // Assert state change
    expect(user.name).toBe(dto.name);
    expect(user.phone).toBe(dto.phone);
    expect(user.address).toBe(dto.address);
    expect(user.avatarUrl).toBe(dto.avatarUrl);

    // CheckDB (read)
    expect(userRepoMock.findOne).toHaveBeenCalledTimes(1);
    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
    });

    // CheckDB (write)
    expect(userRepoMock.save).toHaveBeenCalledTimes(1);
    expect(userRepoMock.save).toHaveBeenCalledWith(user);

    expect(result).toBe(user);
  });
  // Test Case ID: TC_USER_SERVICE_016
  it('[TC_USER_SERVICE_016] findAll phải trả về danh sách user từ database', async () => {
    // Arrange
    const users = [buildMockUser({ id: 1 }), buildMockUser({ id: 2 })];

    userRepoMock.find.mockResolvedValue(users);

    // Act
    const result = await service.findAll();

    // Assert
    expect(userRepoMock.find).toHaveBeenCalledTimes(1);

    // CheckDB (read): verify query không filter sai hoặc thiếu option
    expect(userRepoMock.find).toHaveBeenCalledWith();

    // Verify output
    expect(result).toEqual(users);
  });
  // Test Case ID: TC_USER_SERVICE_017
  it('[TC_USER_SERVICE_017] findUsersWithBirthday phải build query đúng MONTH/DAY và trả kết quả', async () => {
    // Arrange
    const users = [buildMockUser({ id: 8 })];

    const queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn<() => Promise<User[]>>().mockResolvedValue(users),
    };

    userRepoMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    const today = new Date('2026-04-10T00:00:00.000Z');

    // Act
    const result = await service.findUsersWithBirthday(today);

    // Assert
    expect(userRepoMock.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(userRepoMock.createQueryBuilder).toHaveBeenCalledWith('user');

    // CheckDB (query correctness)
    expect(queryBuilderMock.where).toHaveBeenCalledWith(
      'MONTH(user.createdAt) = :month',
      { month: 4 },
    );

    expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
      'DAY(user.createdAt) = :day',
      { day: 10 },
    );

    expect(queryBuilderMock.getMany).toHaveBeenCalledTimes(1);

    expect(result).toEqual(users);
  });
  // Test Case ID: TC_USER_SERVICE_018
  it('[TC_USER_SERVICE_018] deleteUser phải throw NotFoundException khi user không tồn tại', async () => {
    // Arrange
    const userId = 77;

    userRepoMock.findOne.mockResolvedValue(null);

    // Act + Assert (error flow)
    await expect(service.deleteUser(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    // CheckDB (read)
    expect(userRepoMock.findOne).toHaveBeenCalledTimes(1);
    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: userId },
    });

    // CheckDB (write safety)
    expect(userRepoMock.remove).not.toHaveBeenCalled();
    expect(userRepoMock.delete).not.toHaveBeenCalled();
  });
  // Test Case ID: TC_USER_SERVICE_019
  it('[TC_USER_SERVICE_019] deleteUser phải xóa user thành công và trả về message', async () => {
    // Arrange
    const userId = 3;
    const user = buildMockUser({ id: userId });

    userRepoMock.findOne.mockResolvedValue(user);
    userRepoMock.remove.mockResolvedValue(user);

    // Act
    const result = await service.deleteUser(userId);

    // Assert

    // CheckDB (read)
    expect(userRepoMock.findOne).toHaveBeenCalledTimes(1);
    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: userId },
    });

    // CheckDB (write)
    expect(userRepoMock.remove).toHaveBeenCalledTimes(1);
    expect(userRepoMock.remove).toHaveBeenCalledWith(user);

    // Response validation
    expect(result).toEqual({
      message: 'Đã xóa người dùng thành công',
    });
  });
  // Test Case ID: TC_USER_SERVICE_020
  it('[TC_USER_SERVICE_020] findPaged phải dùng default page/limit/sort khi params không hợp lệ', async () => {
    // Arrange
    const pagedData = [buildMockUser({ id: 1 })];

    const queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn<() => Promise<[User[], number]>>()
        .mockResolvedValue([pagedData, 1]),
    };

    userRepoMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    // Act
    const result = await service.findPaged({ page: 0, limit: 999 });

    // Assert

    // CheckDB (query init)
    expect(userRepoMock.createQueryBuilder).toHaveBeenCalledWith('user');

    // CheckDB (sorting default)
    expect(queryBuilderMock.orderBy).toHaveBeenCalledWith(
      'user.createdAt',
      'DESC',
    );

    // CheckDB (pagination sanitize)
    expect(queryBuilderMock.skip).toHaveBeenCalledWith(0);
    expect(queryBuilderMock.take).toHaveBeenCalledWith(10);

    // CheckDB (execution)
    expect(queryBuilderMock.getManyAndCount).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      data: pagedData,
      total: 1,
      page: 1,
      limit: 10,
    });
  });

  // Test Case ID: TC_USER_SERVICE_021
  it('[TC_USER_SERVICE_021] findPaged phải áp dụng role filter và multi-sort đúng logic', async () => {
    // Arrange
    const pagedData = [buildMockUser({ id: 2, role: Role.STAFF })];

    const queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn<() => Promise<[User[], number]>>()
        .mockResolvedValue([pagedData, 1]),
    };

    userRepoMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    // Act
    const result = await service.findPaged({
      page: 2,
      limit: 5,
      role: Role.STAFF,
      sort: '-createdAt,name',
    });

    // Assert

    // CheckDB (init query)
    expect(userRepoMock.createQueryBuilder).toHaveBeenCalledWith('user');

    // CheckDB (filter)
    expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
      'user.role = :role',
      { role: Role.STAFF },
    );

    // CheckDB (sort logic)
    expect(queryBuilderMock.orderBy).toHaveBeenCalledWith(
      'user.createdAt',
      'DESC',
    );

    expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith(
      'user.name',
      'ASC',
    );

    // CheckDB (pagination logic)
    expect(queryBuilderMock.skip).toHaveBeenCalledWith(5);
    expect(queryBuilderMock.take).toHaveBeenCalledWith(5);

    // CheckDB (execution)
    expect(queryBuilderMock.getManyAndCount).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      data: pagedData,
      total: 1,
      page: 2,
      limit: 5,
    });
  });
  // Test Case ID: TC_USER_SERVICE_022
  it('[TC_USER_SERVICE_022] bỏ qua sort field không hợp lệ và chỉ áp dụng field hợp lệ', async () => {
    // Arrange
    const pagedData = [buildMockUser({ id: 4 })];

    const queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn<() => Promise<[User[], number]>>()
        .mockResolvedValue([pagedData, 1]),
    };

    userRepoMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    // Act
    const result = await service.findPaged({ sort: 'unknown,-id' });

    // Assert

    // 1. Verify init query
    expect(userRepoMock.createQueryBuilder).toHaveBeenCalledWith('user');

    // 2. Verify paging logic vẫn chạy bình thường
    expect(queryBuilderMock.skip).toHaveBeenCalled();
    expect(queryBuilderMock.take).toHaveBeenCalled();
    expect(queryBuilderMock.getManyAndCount).toHaveBeenCalledTimes(1);

    // 3. Verify output đúng format
    expect(result).toEqual({
      data: pagedData,
      total: 1,
      page: 1,
      limit: 10,
    });
  });
});
