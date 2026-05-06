import { ForbiddenException } from '@nestjs/common';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { AdminUsersController } from './admin-user.controller';
import { UsersService } from '@modules/user/services/user.service';
import { Role } from '@modules/auth/role.enum';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;

  // Mock service de unit test chi tap trung vao logic controller va phan quyen.
  const usersServiceMock = {
    findPaged: jest.fn<(...args: any[]) => Promise<any>>(),
    createStaffUser: jest.fn<(...args: any[]) => Promise<any>>(),
    findById: jest.fn<(...args: any[]) => Promise<any>>(),
    updateUser: jest.fn<(...args: any[]) => Promise<any>>(),
    deleteUser: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  beforeEach(() => {
    // Lam sach lich su mock truoc moi testcase.
    jest.clearAllMocks();

    controller = new AdminUsersController(
      usersServiceMock as unknown as UsersService,
    );
  });

  afterEach(() => {
    // Rollback mock state sau moi testcase.
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_001
  it('[TC_ADMIN_USER_CTRL_001] ADMIN sử dụng role filter từ query khi gọi getUsers', async () => {
    // Arrange: user có quyền ADMIN và truyền role filter từ query
    const req = { user: { role: Role.ADMIN } };

    const mockResponse = { data: [], total: 0 };
    usersServiceMock.findPaged.mockResolvedValue(mockResponse);

    const result = await controller.getUsers(
      req as any,
      '2', // page (string)
      '20', // limit (string)
      '-createdAt', // sort
      Role.STAFF, // role filter từ query
    );

    // kiểm tra mapping params đúng
    expect(usersServiceMock.findPaged).toHaveBeenCalledTimes(1);

    expect(usersServiceMock.findPaged).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2, // convert từ string → number
        limit: 20, // convert từ string → number
        sort: '-createdAt',
        role: Role.STAFF, // ADMIN được phép dùng filter từ query
      }),
    );

    expect(result).toEqual(mockResponse);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_002
  it('[TC_ADMIN_USER_CTRL_002] STAFF bị ép role filter = USER khi gọi getUsers', async () => {
    const req = { user: { role: Role.STAFF } };

    const mockResponse = { data: [], total: 0 };
    usersServiceMock.findPaged.mockResolvedValue(mockResponse);

    const result = await controller.getUsers(
      req as any,
      '1', // page (string)
      '10', // limit (string)
      'name', // sort
      Role.ADMIN, // bị ignore vì STAFF không có quyền
    );

    expect(usersServiceMock.findPaged).toHaveBeenCalledTimes(1);

    expect(usersServiceMock.findPaged).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        sort: 'name',
        role: Role.USER, // bị ép về USER
      }),
    );

    expect(result).toEqual(mockResponse);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_003
  it('[TC_ADMIN_USER_CTRL_003] không parse page/limit khi query không truyền', async () => {
    const req = { user: { role: Role.ADMIN } };

    const mockResponse = { data: [], total: 0 };
    usersServiceMock.findPaged.mockResolvedValue(mockResponse);

    const result = await controller.getUsers(
      req as any,
      undefined, // page
      undefined, // limit
      undefined, // sort
      undefined, // role
    );

    expect(usersServiceMock.findPaged).toHaveBeenCalledTimes(1);

    // Kiểm tra mapping params (không bị parse sai)
    expect(usersServiceMock.findPaged).toHaveBeenCalledWith(
      expect.objectContaining({
        page: undefined,
        limit: undefined,
        sort: undefined,
        role: undefined,
      }),
    );

    expect(result).toEqual(mockResponse);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_004
  it('[TC_ADMIN_USER_CTRL_004] createStaffUser forward đúng DTO xuống service và trả về kết quả', async () => {
    const body = {
      name: 'Staff A',
      email: 'staff@example.com',
      password: '123456',
      phone: '0123456789',
      address: 'HN',
    };

    const mockResponse = {
      id: 10,
      ...body,
      role: Role.STAFF,
    };

    usersServiceMock.createStaffUser.mockResolvedValue(mockResponse);
    // clone để đảm bảo không bị mutate
    const originalBody = { ...body };

    const result = await controller.createStaffUser(body as any);

    expect(usersServiceMock.createStaffUser).toHaveBeenCalledTimes(1);

    expect(usersServiceMock.createStaffUser).toHaveBeenCalledWith(
      expect.objectContaining({
        name: body.name,
        email: body.email,
        password: body.password,
        phone: body.phone,
        address: body.address,
      }),
    );

    expect(body).toEqual(originalBody);

    // Response validation
    expect(result).toEqual(mockResponse);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_005
  it('[TC_ADMIN_USER_CTRL_005] ADMIN có thể lấy thông tin user bất kỳ theo id', async () => {
    const req = { user: { role: Role.ADMIN } };

    const userId = 5;
    const mockUser = { id: userId, role: Role.STAFF };

    usersServiceMock.findById.mockResolvedValue(mockUser);

    const result = await controller.getUser(req as any, userId);

    expect(usersServiceMock.findById).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.findById).toHaveBeenCalledWith(userId);

    expect(result).toEqual(mockUser);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_006
  it('[TC_ADMIN_USER_CTRL_006] STAFF bị chặn khi target user không phải USER', async () => {
    const req = { user: { role: Role.STAFF } };

    const userId = 5;
    const targetUser = { id: userId, role: Role.ADMIN };

    usersServiceMock.findById.mockResolvedValue(targetUser);

    await expect(controller.getUser(req as any, userId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(usersServiceMock.findById).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.findById).toHaveBeenCalledWith(userId);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_007
  it('[TC_ADMIN_USER_CTRL_007] STAFF được phép xem user khi target có role USER', async () => {
    const req = { user: { role: Role.STAFF } };

    const userId = 6;
    const targetUser = { id: userId, role: Role.USER };

    usersServiceMock.findById.mockResolvedValue(targetUser);

    const result = await controller.getUser(req as any, userId);

    expect(usersServiceMock.findById).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.findById).toHaveBeenCalledWith(userId);

    expect(result).toEqual(targetUser);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_008
  it('[TC_ADMIN_USER_CTRL_008] ADMIN gọi updateUser trực tiếp, không cần check target', async () => {
    const req = { user: { role: Role.ADMIN } };

    const body = {
      id: 1,
      name: 'Updated',
      role: Role.STAFF,
    };

    const mockResponse = {
      id: 1,
      name: 'Updated',
      role: Role.STAFF,
    };

    usersServiceMock.updateUser.mockResolvedValue(mockResponse);

    const originalBody = { ...body }; // để check mutation

    const result = await controller.updateUser(req as any, body as any);

    expect(usersServiceMock.findById).not.toHaveBeenCalled();

    expect(usersServiceMock.updateUser).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: body.id,
        name: body.name,
        role: body.role,
      }),
    );

    expect(body).toEqual(originalBody);

    expect(result).toEqual(mockResponse);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_009
  it('[TC_ADMIN_USER_CTRL_009] STAFF bị chặn khi update user không phải USER', async () => {
    const req = { user: { role: Role.STAFF } };

    const body = {
      id: 9,
      name: 'Try Update',
    };

    const targetUser = { id: 9, role: Role.ADMIN };

    usersServiceMock.findById.mockResolvedValue(targetUser);

    const originalBody = { ...body };

    await expect(
      controller.updateUser(req as any, body as any),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(usersServiceMock.findById).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.findById).toHaveBeenCalledWith(body.id);

    // Assert: KHÔNG được gọi updateUser
    expect(usersServiceMock.updateUser).not.toHaveBeenCalled();

    expect(body).toEqual(originalBody);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_010
  it('[TC_ADMIN_USER_CTRL_010] STAFF bị chặn khi cố ý thay đổi role của user', async () => {
    const req = { user: { role: Role.STAFF } };

    const body = {
      id: 8,
      role: Role.ADMIN, // hành vi bị cấm
    };

    const targetUser = {
      id: 8,
      role: Role.USER, // target hợp lệ nhưng payload sai
    };

    usersServiceMock.findById.mockResolvedValue(targetUser);

    const originalBody = { ...body };

    // Act & Assert: phải bị chặn
    await expect(
      controller.updateUser(req as any, body as any),
    ).rejects.toBeInstanceOf(ForbiddenException);

    // Assert: vẫn phải gọi findById để check quyền target
    expect(usersServiceMock.findById).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.findById).toHaveBeenCalledWith(body.id);

    expect(usersServiceMock.updateUser).not.toHaveBeenCalled();

    expect(body).toEqual(originalBody);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_011
  it('[TC_ADMIN_USER_CTRL_011] STAFF được phép update khi target là USER và role giữ nguyên USER', async () => {
    const req = { user: { role: Role.STAFF } };

    const body = {
      id: 7,
      name: 'User Updated',
      role: Role.USER,
    };

    const targetUser = { id: 7, role: Role.USER };
    const mockResponse = { ...body };

    usersServiceMock.findById.mockResolvedValue(targetUser);
    usersServiceMock.updateUser.mockResolvedValue(mockResponse);

    const originalBody = { ...body };

    const result = await controller.updateUser(req as any, body as any);

    expect(usersServiceMock.findById).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.findById).toHaveBeenCalledWith(body.id);

    expect(usersServiceMock.updateUser).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.updateUser).toHaveBeenCalledWith(
      expect.objectContaining(body),
    );

    expect(body).toEqual(originalBody);

    expect(result).toEqual(mockResponse);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_012
  it('[TC_ADMIN_USER_CTRL_012] STAFF được phép update khi target là USER và không truyền role', async () => {
    const req = { user: { role: Role.STAFF } };

    const body = {
      id: 7,
      name: 'User Updated',
      // không có role
    };

    const targetUser = { id: 7, role: Role.USER };
    const mockResponse = { id: 7, name: 'User Updated', role: Role.USER };

    usersServiceMock.findById.mockResolvedValue(targetUser);
    usersServiceMock.updateUser.mockResolvedValue(mockResponse);

    const originalBody = { ...body };

    const result = await controller.updateUser(req as any, body as any);

    expect(usersServiceMock.findById).toHaveBeenCalledWith(body.id);
    expect(usersServiceMock.updateUser).toHaveBeenCalledTimes(1);

    // chỉ check field cần thiết để tránh brittle
    expect(usersServiceMock.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: body.id,
        name: body.name,
      }),
    );

    expect(body).toEqual(originalBody);
    expect(result).toEqual(mockResponse);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_013
  it('[TC_ADMIN_USER_CTRL_013] ADMIN xóa user trực tiếp, không cần kiểm tra target', async () => {
    const req = { user: { role: Role.ADMIN } };

    const userId = 4;
    const mockResponse = { message: 'deleted' };

    usersServiceMock.deleteUser.mockResolvedValue(mockResponse);

    const result = await controller.deleteUser(req as any, userId);

    // Assert: không gọi findById (bypass RBAC check)
    expect(usersServiceMock.findById).not.toHaveBeenCalled();

    // Assert: gọi deleteUser đúng 1 lần với id chính xác
    expect(usersServiceMock.deleteUser).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.deleteUser).toHaveBeenCalledWith(userId);

    expect(result).toEqual(mockResponse);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_014
  it('deleteUser voi STAFF bi chan khi target khong phai USER', async () => {
    const req = { user: { role: Role.STAFF } };
    usersServiceMock.findById.mockResolvedValue({ id: 4, role: Role.STAFF });

    await expect(controller.deleteUser(req as any, 4)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(usersServiceMock.deleteUser).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_015
  it('[TC_ADMIN_USER_CTRL_015] STAFF được phép xóa khi target là USER', async () => {
    const req = { user: { role: Role.STAFF } };

    const userId = 3;

    const targetUser = {
      id: userId,
      role: Role.USER,
    };

    const mockResponse = { message: 'deleted user' };

    usersServiceMock.findById.mockResolvedValue(targetUser);
    usersServiceMock.deleteUser.mockResolvedValue(mockResponse);

    const result = await controller.deleteUser(req as any, userId);

    // Assert: phải check target trước khi xóa (RBAC)
    expect(usersServiceMock.findById).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.findById).toHaveBeenCalledWith(userId);

    expect(usersServiceMock.deleteUser).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.deleteUser).toHaveBeenCalledWith(userId);

    expect(result).toEqual(mockResponse);
  });
});
