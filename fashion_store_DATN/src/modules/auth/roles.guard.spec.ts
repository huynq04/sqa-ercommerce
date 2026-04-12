import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  // Mock Reflector de chu dong dieu khien role metadata theo tung testcase.
  const reflectorMock = {
    getAllAndOverride: jest.fn<(...args: any[]) => Role[] | undefined>(),
  };

  // Helper tao ExecutionContext gia lap cho HTTP request.
  const createExecutionContext = (user?: Record<string, any>) => {
    const request = { user };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    return {
      context: context as any,
      request,
    };
  };

  beforeEach(async () => {
    // Lam sach lich su goi mock truoc moi testcase.
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: reflectorMock,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  afterEach(() => {
    // Rollback mock state sau moi test.
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_ROLES_GUARD_001
  it('tra ve true khi route khong yeu cau roles', () => {
    // Muc tieu: neu route khong gan @Roles thi cho phep truy cap.
    // Input: requiredRoles = undefined.
    // Ky vong: canActivate tra ve true.
    reflectorMock.getAllAndOverride.mockReturnValue(undefined);
    const { context } = createExecutionContext({ role: Role.USER });

    const result = guard.canActivate(context);

    expect(reflectorMock.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    expect(result).toBe(true);
  });

  // Test Case ID: TC_ROLES_GUARD_002
  it('nem ForbiddenException khi route can role nhung request khong co user', () => {
    // Muc tieu: chan truy cap neu chua dang nhap ma route can role.
    // Input: requiredRoles co gia tri, request.user = undefined.
    // Ky vong: nem ForbiddenException.
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const { context } = createExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  // Test Case ID: TC_ROLES_GUARD_003
  it('nem ForbiddenException khi user khong co truong role', () => {
    // Muc tieu: dam bao user phai co thong tin role de xet quyen.
    // Input: request.user ton tai nhung role bi thieu.
    // Ky vong: nem ForbiddenException.
    reflectorMock.getAllAndOverride.mockReturnValue([Role.STAFF]);
    const { context } = createExecutionContext({ id: 10 });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  // Test Case ID: TC_ROLES_GUARD_004
  it('tra ve true khi user co role phu hop voi required roles', () => {
    // Muc tieu: cho phep truy cap khi role cua user khop role yeu cau.
    // Input: requiredRoles = [ADMIN], user.role = 'admin'.
    // Ky vong: canActivate tra true.
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const { context } = createExecutionContext({ role: Role.ADMIN });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  // Test Case ID: TC_ROLES_GUARD_005
  it('tra ve true khi user role dang chuoi co chua role yeu cau', () => {
    // Muc tieu: bao phu logic includes trong code hien tai.
    // Input: requiredRoles = [STAFF], user.role = 'staff,admin'.
    // Ky vong: canActivate tra true.
    reflectorMock.getAllAndOverride.mockReturnValue([Role.STAFF]);
    const { context } = createExecutionContext({ role: 'staff,admin' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  // Test Case ID: TC_ROLES_GUARD_006
  it('nem ForbiddenException khi user khong du quyen', () => {
    // Muc tieu: chan request khi user role khong nam trong required roles.
    // Input: requiredRoles = [ADMIN], user.role = 'user'.
    // Ky vong: nem ForbiddenException voi thong diep khong du quyen.
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const { context } = createExecutionContext({ role: Role.USER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
