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

  // Test Case ID: UT_USER_SERVICE_001
  it('findOneByEmail tra ve user khi tim thay theo email', async () => {
    // Muc tieu: xac minh service goi dung repository query theo email.
    const user = buildMockUser();
    userRepoMock.findOne.mockResolvedValue(user);

    const result = await service.findOneByEmail('user@example.com');

    // CheckDB (read): verify repository query theo email.
    expect(userRepoMock.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
    expect(result).toBe(user);
  });

  // Test Case ID: UT_USER_SERVICE_002
  it('findById nem NotFoundException khi khong ton tai user', async () => {
    // Muc tieu: xac minh truy van DB theo id va xu ly khong tim thay.
    userRepoMock.findOne.mockResolvedValue(null);

    await expect(service.findById(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    // CheckDB (read): verify query theo id.
    expect(userRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 99 } });
  });

  // Test Case ID: UT_USER_SERVICE_003
  it('findById tra ve user khi tim thay', async () => {
    // Muc tieu: xac minh truy van DB theo id va tra ve user dung.
    const user = buildMockUser({ id: 10 });
    userRepoMock.findOne.mockResolvedValue(user);

    const result = await service.findById(10);

    // CheckDB (read): verify query theo id.
    expect(userRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 10 } });
    expect(result).toBe(user);
  });

  // Test Case ID: UT_USER_SERVICE_004
  it('upgradeRole cap nhat role va luu lai user', async () => {
    // CheckDB: xac minh role duoc cap nhat va save duoc goi.
    const user = buildMockUser({ role: Role.USER });
    registerRollbackSnapshot(user);
    userRepoMock.findOne.mockResolvedValue(user);
    userRepoMock.save.mockResolvedValue(user);

    const result = await service.upgradeRole(1, Role.ADMIN);

    expect(user.role).toBe(Role.ADMIN);
    expect(userRepoMock.save).toHaveBeenCalledWith(user);
    expect(result).toBe(user);
  });

  // Test Case ID: UT_USER_SERVICE_005
  it('updateUser cap nhat thong tin va hash password neu co password moi', async () => {
    const user = buildMockUser();
    registerRollbackSnapshot(user);
    userRepoMock.findOne.mockResolvedValue(user);
    bcryptMock.hash.mockResolvedValue('new-hash' as never);
    userRepoMock.save.mockResolvedValue(user);

    const result = await service.updateUser({
      id: 1,
      name: 'Updated Name',
      email: 'updated@example.com',
      password: 'new-password',
      phone: '0988888888',
      address: 'HCM',
      role: Role.STAFF,
      avatarUrl: 'new-avatar.png',
    });

    // CheckDB
    expect(user.name).toBe('Updated Name');
    expect(user.email).toBe('updated@example.com');
    expect(user.phone).toBe('0988888888');
    expect(user.address).toBe('HCM');
    expect(user.role).toBe(Role.STAFF);
    expect(user.avatarUrl).toBe('new-avatar.png');
    expect(user.passwordHash).toBe('new-hash');
    expect(userRepoMock.save).toHaveBeenCalledWith(user);
    expect(result).toBe(user);
  });

  // Test Case ID: UT_USER_SERVICE_006
  it('updateUser giu nguyen passwordHash neu khong truyen password', async () => {
    const user = buildMockUser({ passwordHash: 'old-hash' });
    registerRollbackSnapshot(user);
    userRepoMock.findOne.mockResolvedValue(user);
    userRepoMock.save.mockResolvedValue(user);

    const result = await service.updateUser({
      id: 1,
      name: 'Name Only',
    });

    expect(bcryptMock.hash).not.toHaveBeenCalled();
    expect(user.passwordHash).toBe('old-hash');
    expect(result).toBe(user);
  });

  // Test Case ID: UT_USER_SERVICE_007
  it('createStaffUser nem ConflictException khi thieu email hoac phone', async () => {
    await expect(
      service.createStaffUser({
        name: 'Staff',
        email: '',
        password: '123456',
        phone: '',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // Test Case ID: UT_USER_SERVICE_008
  it('createStaffUser nem ConflictException khi email hoac phone da ton tai', async () => {
    userRepoMock.findOne.mockResolvedValue(buildMockUser());

    await expect(
      service.createStaffUser({
        name: 'Staff',
        email: 'staff@example.com',
        password: '123456',
        phone: '0123456789',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // Test Case ID: UT_USER_SERVICE_009
  it('createStaffUser tao user role STAFF, hash password va save', async () => {
    userRepoMock.findOne.mockResolvedValue(null);
    userRepoMock.create.mockImplementation((input) => input);
    const saved = buildMockUser({ role: Role.STAFF, isVerified: true });
    userRepoMock.save.mockResolvedValue(saved);
    bcryptMock.hash.mockResolvedValue('staff-hash' as never);

    const dto = {
      name: 'Staff',
      email: 'staff@example.com',
      password: '123456',
      phone: '0123456789',
      address: 'DN',
    };

    const result = await service.createStaffUser(dto);

    // CheckDB
    expect(userRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        passwordHash: 'staff-hash',
        role: Role.STAFF,
        isVerified: true,
      }),
    );
    expect(userRepoMock.save).toHaveBeenCalled();
    expect(result).toBe(saved);
  });

  // Test Case ID: UT_USER_SERVICE_010
  it('updateProfile cap nhat field cho chinh user va save', async () => {
    const user = buildMockUser();
    registerRollbackSnapshot(user);
    userRepoMock.findOne.mockResolvedValue(user);
    userRepoMock.save.mockResolvedValue(user);

    const result = await service.updateProfile(1, {
      name: 'Profile Name',
      phone: '0999999999',
      address: 'Can Tho',
      avatarUrl: 'profile.png',
    });

    // CheckDB
    expect(user.name).toBe('Profile Name');
    expect(user.phone).toBe('0999999999');
    expect(user.address).toBe('Can Tho');
    expect(user.avatarUrl).toBe('profile.png');
    expect(userRepoMock.save).toHaveBeenCalledWith(user);
    expect(result).toBe(user);
  });

  // Test Case ID: UT_USER_SERVICE_011
  it('findAll tra ve danh sach user', async () => {
    const users = [buildMockUser({ id: 1 }), buildMockUser({ id: 2 })];
    userRepoMock.find.mockResolvedValue(users);

    const result = await service.findAll();

    expect(userRepoMock.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual(users);
  });

  // Test Case ID: UT_USER_SERVICE_012
  it('findUsersWithBirthday tao query dung month/day va tra ket qua', async () => {
    const users = [buildMockUser({ id: 8 })];

    const queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn<() => Promise<User[]>>().mockResolvedValue(users),
    };
    userRepoMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    const today = new Date('2026-04-10T00:00:00.000Z');
    const result = await service.findUsersWithBirthday(today);

    // CheckDB: xac minh build query dung dieu kien month/day.
    expect(userRepoMock.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(queryBuilderMock.where).toHaveBeenCalledWith(
      'MONTH(user.createdAt) = :month',
      { month: 4 },
    );
    expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
      'DAY(user.createdAt) = :day',
      { day: 10 },
    );
    expect(result).toEqual(users);
  });

  // Test Case ID: UT_USER_SERVICE_013
  it('deleteUser nem NotFoundException khi user khong ton tai', async () => {
    userRepoMock.findOne.mockResolvedValue(null);

    await expect(service.deleteUser(77)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Test Case ID: UT_USER_SERVICE_014
  it('deleteUser remove user thanh cong va tra thong diep', async () => {
    const user = buildMockUser({ id: 3 });
    userRepoMock.findOne.mockResolvedValue(user);
    userRepoMock.remove.mockResolvedValue(user);

    const result = await service.deleteUser(3);

    // CheckDB
    expect(userRepoMock.remove).toHaveBeenCalledWith(user);
    expect(result).toEqual({ message: expect.any(String) });
  });

  // Test Case ID: UT_USER_SERVICE_015
  it('findPaged dung default page/limit/sort khi params khong hop le', async () => {
    const pagedData = [buildMockUser({ id: 1 })];
    const queryBuilderMock = {
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

    const result = await service.findPaged({ page: 0, limit: 999 });

    expect(queryBuilderMock.orderBy).toHaveBeenCalledWith(
      'user.createdAt',
      'DESC',
    );
    expect(queryBuilderMock.skip).toHaveBeenCalledWith(0);
    expect(queryBuilderMock.take).toHaveBeenCalledWith(10);
    expect(result).toEqual({ data: pagedData, total: 1, page: 1, limit: 10 });
  });

  // Test Case ID: UT_USER_SERVICE_016
  it('findPaged ap dung role filter va multi sort hop le', async () => {
    const pagedData = [buildMockUser({ id: 2, role: Role.STAFF })];
    const queryBuilderMock = {
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

    const result = await service.findPaged({
      page: 2,
      limit: 5,
      role: Role.STAFF,
      sort: '-createdAt,name',
    });

    // CheckDB: xac minh filter/sort/pagination duoc build dung.
    expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
      'user.role = :role',
      {
        role: Role.STAFF,
      },
    );
    expect(queryBuilderMock.orderBy).toHaveBeenCalledWith(
      'user.createdAt',
      'DESC',
    );
    expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith(
      'user.name',
      'ASC',
    );
    expect(queryBuilderMock.skip).toHaveBeenCalledWith(5);
    expect(queryBuilderMock.take).toHaveBeenCalledWith(5);
    expect(result).toEqual({ data: pagedData, total: 1, page: 2, limit: 5 });
  });

  // Test Case ID: UT_USER_SERVICE_017
  it('findPaged bo qua sort field khong hop le va van giu orderBy hop le', async () => {
    const pagedData = [buildMockUser({ id: 4 })];
    const queryBuilderMock = {
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

    await service.findPaged({ sort: 'unknown,-id' });

    // token unknown bi bo qua; token -id hop le duoc ap dung o addOrderBy
    // theo logic hien tai cua service.
    expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith('user.id', 'DESC');
  });
});
