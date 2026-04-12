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
  it('getUsers voi ADMIN su dung role filter tu query', async () => {
    // Muc tieu: ADMIN co the truyen role filter tuy y.
    const req = { user: { role: Role.ADMIN } };
    usersServiceMock.findPaged.mockResolvedValue({ data: [], total: 0 });

    const result = await controller.getUsers(
      req as any,
      '2',
      '20',
      '-createdAt',
      Role.STAFF,
    );

    // CheckDB (gian tiep): xac minh params phan trang/loc duoc map dung.
    expect(usersServiceMock.findPaged).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      sort: '-createdAt',
      role: Role.STAFF,
    });
    expect(result).toEqual({ data: [], total: 0 });
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_002
  it('getUsers voi STAFF bat buoc role filter = USER', async () => {
    // Muc tieu: STAFF chi duoc xem user thuong, khong duoc tu y role filter.
    const req = { user: { role: Role.STAFF } };
    usersServiceMock.findPaged.mockResolvedValue({ data: [], total: 0 });

    await controller.getUsers(req as any, '1', '10', 'name', Role.ADMIN);

    expect(usersServiceMock.findPaged).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      sort: 'name',
      role: Role.USER,
    });
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_003
  it('getUsers parse page/limit undefined khi query khong truyen', async () => {
    const req = { user: { role: Role.ADMIN } };
    usersServiceMock.findPaged.mockResolvedValue({ data: [], total: 0 });

    await controller.getUsers(
      req as any,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    expect(usersServiceMock.findPaged).toHaveBeenCalledWith({
      page: undefined,
      limit: undefined,
      sort: undefined,
      role: undefined,
    });
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_004
  it('createStaffUser goi usersService.createStaffUser voi body', async () => {
    const body = {
      name: 'Staff A',
      email: 'staff@example.com',
      password: '123456',
      phone: '0123456789',
      address: 'HN',
    };
    usersServiceMock.createStaffUser.mockResolvedValue({
      id: 10,
      ...body,
      role: Role.STAFF,
    });

    const result = await controller.createStaffUser(body as any);

    // CheckDB (gian tiep): xac minh controller forward DTO dung.
    expect(usersServiceMock.createStaffUser).toHaveBeenCalledWith(body);
    expect(result).toEqual({ id: 10, ...body, role: Role.STAFF });
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_005
  it('getUser voi ADMIN tra ve user bat ky', async () => {
    const req = { user: { role: Role.ADMIN } };
    const target = { id: 5, role: Role.STAFF };
    usersServiceMock.findById.mockResolvedValue(target);

    const result = await controller.getUser(req as any, 5);

    expect(usersServiceMock.findById).toHaveBeenCalledWith(5);
    expect(result).toBe(target);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_006
  it('getUser voi STAFF bi chan khi target khong phai USER', async () => {
    const req = { user: { role: Role.STAFF } };
    usersServiceMock.findById.mockResolvedValue({ id: 5, role: Role.ADMIN });

    await expect(controller.getUser(req as any, 5)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_007
  it('getUser voi STAFF duoc xem khi target la USER', async () => {
    const req = { user: { role: Role.STAFF } };
    const target = { id: 6, role: Role.USER };
    usersServiceMock.findById.mockResolvedValue(target);

    const result = await controller.getUser(req as any, 6);

    expect(result).toBe(target);
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_008
  it('updateUser voi ADMIN goi updateUser truc tiep', async () => {
    const req = { user: { role: Role.ADMIN } };
    const body = { id: 1, name: 'Updated', role: Role.STAFF };
    usersServiceMock.updateUser.mockResolvedValue({
      id: 1,
      name: 'Updated',
      role: Role.STAFF,
    });

    const result = await controller.updateUser(req as any, body as any);

    expect(usersServiceMock.findById).not.toHaveBeenCalled();
    expect(usersServiceMock.updateUser).toHaveBeenCalledWith(body);
    expect(result).toEqual({ id: 1, name: 'Updated', role: Role.STAFF });
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_009
  it('updateUser voi STAFF bi chan khi target khong phai USER', async () => {
    const req = { user: { role: Role.STAFF } };
    const body = { id: 9, name: 'Try Update' };
    usersServiceMock.findById.mockResolvedValue({ id: 9, role: Role.ADMIN });

    await expect(
      controller.updateUser(req as any, body as any),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(usersServiceMock.updateUser).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_010
  it('updateUser voi STAFF bi chan khi co y doi role thanh khac USER', async () => {
    const req = { user: { role: Role.STAFF } };
    const body = { id: 8, role: Role.ADMIN };
    usersServiceMock.findById.mockResolvedValue({ id: 8, role: Role.USER });

    await expect(
      controller.updateUser(req as any, body as any),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(usersServiceMock.updateUser).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_011
  it('updateUser voi STAFF duoc phep khi target la USER va role update la USER hoac khong co', async () => {
    const req = { user: { role: Role.STAFF } };
    const body = { id: 7, name: 'User Updated', role: Role.USER };
    usersServiceMock.findById.mockResolvedValue({ id: 7, role: Role.USER });
    usersServiceMock.updateUser.mockResolvedValue({
      id: 7,
      name: 'User Updated',
      role: Role.USER,
    });

    const result = await controller.updateUser(req as any, body as any);

    // CheckDB (gian tiep): xac minh co check target role truoc khi update.
    expect(usersServiceMock.findById).toHaveBeenCalledWith(7);
    expect(usersServiceMock.updateUser).toHaveBeenCalledWith(body);
    expect(result).toEqual({ id: 7, name: 'User Updated', role: Role.USER });
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_012
  it('deleteUser voi ADMIN goi usersService.deleteUser truc tiep', async () => {
    const req = { user: { role: Role.ADMIN } };
    usersServiceMock.deleteUser.mockResolvedValue({ message: 'deleted' });

    const result = await controller.deleteUser(req as any, 4);

    expect(usersServiceMock.findById).not.toHaveBeenCalled();
    expect(usersServiceMock.deleteUser).toHaveBeenCalledWith(4);
    expect(result).toEqual({ message: 'deleted' });
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_013
  it('deleteUser voi STAFF bi chan khi target khong phai USER', async () => {
    const req = { user: { role: Role.STAFF } };
    usersServiceMock.findById.mockResolvedValue({ id: 4, role: Role.STAFF });

    await expect(controller.deleteUser(req as any, 4)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(usersServiceMock.deleteUser).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_ADMIN_USER_CTRL_014
  it('deleteUser voi STAFF duoc phep khi target la USER', async () => {
    const req = { user: { role: Role.STAFF } };
    usersServiceMock.findById.mockResolvedValue({ id: 3, role: Role.USER });
    usersServiceMock.deleteUser.mockResolvedValue({ message: 'deleted user' });

    const result = await controller.deleteUser(req as any, 3);

    // CheckDB (gian tiep): xac minh controller check role target truoc khi xoa.
    expect(usersServiceMock.findById).toHaveBeenCalledWith(3);
    expect(usersServiceMock.deleteUser).toHaveBeenCalledWith(3);
    expect(result).toEqual({ message: 'deleted user' });
  });
});
