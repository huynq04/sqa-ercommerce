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

  // Test Case ID: UT_USER_CONTROLLER_001
  it('upgradeUser goi usersService.upgradeRole voi userId va role tu body', async () => {
    // Muc tieu: dam bao endpoint /users/upgrade mapping dung tham so xuong service.
    // Input: body gom userId va role.
    // Ky vong: usersService.upgradeRole(userId, role) duoc goi dung va tra ket qua.
    const body = {
      userId: 10,
      role: Role.STAFF,
    };
    usersServiceMock.upgradeRole.mockResolvedValue({
      id: 10,
      role: Role.STAFF,
    });

    const result = await controller.upgradeUser(body);

    // CheckDB (gian tiep): xac minh service layer duoc goi dung tham so.
    expect(usersServiceMock.upgradeRole).toHaveBeenCalledWith(10, Role.STAFF);
    expect(result).toEqual({ id: 10, role: Role.STAFF });
  });

  // Test Case ID: UT_USER_CONTROLLER_002
  it('updateUser goi usersService.updateUser voi dung body', async () => {
    // Muc tieu: dam bao endpoint /users/update forward full DTO xuong service.
    // Input: UpdateUserDto.
    // Ky vong: usersService.updateUser duoc goi 1 lan voi body.
    const body = {
      id: 1,
      name: 'Updated Name',
      email: 'updated@example.com',
      phone: '0999999999',
      address: 'HCM',
      role: Role.ADMIN,
      avatarUrl: 'avatar-new.png',
    };
    usersServiceMock.updateUser.mockResolvedValue({
      ...body,
      passwordHash: 'hashed',
    });

    const result = await controller.updateUser(body as any);

    expect(usersServiceMock.updateUser).toHaveBeenCalledWith(body);
    expect(result).toEqual({ ...body, passwordHash: 'hashed' });
  });

  // Test Case ID: UT_USER_CONTROLLER_003
  it('updateMe goi usersService.updateProfile voi req.user.sub va body', async () => {
    // Muc tieu: dam bao endpoint /users/me lay dung userId tu req.user.sub.
    // Input: req co user.sub va body profile.
    // Ky vong: updateProfile(sub, body) duoc goi dung thu tu tham so.
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
    usersServiceMock.updateProfile.mockResolvedValue({
      id: 7,
      ...body,
    });

    const result = await controller.updateMe(req as any, body);

    // CheckDB (gian tiep): xac minh service layer duoc goi dung userId dang nhap.
    expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(7, body);
    expect(result).toEqual({ id: 7, ...body });
  });

  // Test Case ID: UT_USER_CONTROLLER_004
  it('updateMe van truyen userId undefined neu req.user khong co sub', async () => {
    // Muc tieu: bao phu hanh vi hien tai cua controller khi req.user.sub bi thieu.
    // Input: req.user khong co truong sub.
    // Ky vong: controller van goi service voi undefined (khong auto throw tai controller).
    const req = {
      user: {},
    };
    const body = {
      name: 'No Sub',
    };
    usersServiceMock.updateProfile.mockResolvedValue({ message: 'handled' });

    const result = await controller.updateMe(req as any, body);

    expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(
      undefined,
      body,
    );
    expect(result).toEqual({ message: 'handled' });
  });
});
