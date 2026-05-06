import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { UsersController } from './user.controller';
import { UsersService } from '@modules/user/services/user.service';
import { Role } from '@modules/auth/role.enum';

describe('UsersController', () => {
  let controller: UsersController;

  // Mock service de unit test chi tap trung vao logic controller.
  const usersServiceMock = {
    upgradeRole: jest.fn<(...args: any[]) => Promise<any>>(),
    updateUser: jest.fn<(...args: any[]) => Promise<any>>(),
    updateProfile: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  beforeEach(() => {
    // Lam sach lich su mock truoc moi testcase.
    jest.clearAllMocks();

    controller = new UsersController(
      usersServiceMock as unknown as UsersService,
    );
  });

  afterEach(() => {
    // Rollback mock state sau moi testcase.
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_USER_CONTROLLER_001
  it('[TC_USER_CONTROLLER_001] USER có thể upgrade role thông qua upgradeUser và truyền đúng dữ liệu xuống service', async () => {
    const body = {
      userId: 10,
      role: Role.STAFF,
    };

    const mockResult = {
      id: 10,
      role: Role.STAFF,
    };

    usersServiceMock.upgradeRole.mockResolvedValue(mockResult);

    const result = await controller.upgradeUser(body as any);

    expect(usersServiceMock.upgradeRole).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.upgradeRole).toHaveBeenCalledWith(10, Role.STAFF);

    expect(result).toEqual(mockResult);
  });

  // Test Case ID: TC_USER_CONTROLLER_002
  it('[TC_USER_CONTROLLER_002] USER có thể cập nhật thông tin thông qua updateUser và truyền đúng DTO xuống service', async () => {
    const body = {
      id: 1,
      name: 'Updated Name',
      email: 'updated@example.com',
      phone: '0999999999',
      address: 'HCM',
      role: Role.ADMIN,
      avatarUrl: 'avatar-new.png',
    };

    const mockResult = {
      ...body,
      passwordHash: 'hashed',
    };

    usersServiceMock.updateUser.mockResolvedValue(mockResult);

    const result = await controller.updateUser(body as any);

    expect(usersServiceMock.updateUser).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.updateUser).toHaveBeenCalledWith(body);

    expect(result).toEqual(mockResult);
  });

  // Test Case ID: TC_USER_CONTROLLER_003
  it('[TC_USER_CONTROLLER_003] USER có thể cập nhật thông tin cá nhân thông qua updateMe với userId lấy từ req.user.sub', async () => {
    const req = {
      user: {
        sub: 7,
      },
    };

    const body = {
      name: 'Profile Name',
      phone: '0888888888',
      address: 'Da Nang',
      avatarUrl: 'me.png',
    };

    const mockResult = {
      id: 7,
      ...body,
    };

    usersServiceMock.updateProfile.mockResolvedValue(mockResult);

    const result = await controller.updateMe(req as any, body);

    expect(usersServiceMock.updateProfile).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(7, body);

    expect(result).toEqual(mockResult);
  });

  // Test Case ID: TC_USER_CONTROLLER_004
  it('[TC_USER_CONTROLLER_004] SYSTEM vẫn gọi updateProfile với userId undefined khi req.user không có sub', async () => {
    const req = {
      user: {},
    };

    const body = {
      name: 'No Sub',
    };

    const mockResult = {
      message: 'handled',
    };

    usersServiceMock.updateProfile.mockResolvedValue(mockResult);

    const result = await controller.updateMe(req as any, body);

    expect(usersServiceMock.updateProfile).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(
      undefined,
      body,
    );

    expect(result).toEqual(mockResult);
  });
});
