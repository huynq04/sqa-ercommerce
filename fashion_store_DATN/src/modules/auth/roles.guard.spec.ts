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

  const reflectorMock = {
    getAllAndOverride: jest.fn<(...args: any[]) => Role[] | undefined>(),
  };

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
    jest.restoreAllMocks();
  });

  // TC_ROLES_GUARD_001
  it('[TC_001] cho phép truy cập khi route không yêu cầu roles', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(undefined);
    const { context } = createExecutionContext({ role: Role.USER });

    const result = guard.canActivate(context);

    expect(reflectorMock.getAllAndOverride).toHaveBeenCalledTimes(1);
    expect(reflectorMock.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    expect(result).toBe(true);
  });

  // TC_ROLES_GUARD_002
  it('[TC_002] ném ForbiddenException khi route yêu cầu role nhưng request không có user', () => {
    // Arrange
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const { context } = createExecutionContext(undefined);

    // Act & Assert
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  // TC_ROLES_GUARD_003
  it('[TC_003] ném ForbiddenException khi user không có trường role', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.STAFF]);
    const { context } = createExecutionContext({ id: 10 });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  // TC_ROLES_GUARD_004
  it('[TC_004] cho phép truy cập khi user có role khớp với required roles', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const { context } = createExecutionContext({ role: Role.ADMIN });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  // TC_ROLES_GUARD_005
  it('[TC_005] cho phép truy cập khi user.role là chuỗi chứa role yêu cầu', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.STAFF]);
    const { context } = createExecutionContext({ role: 'staff,admin' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  // TC_ROLES_GUARD_006
  it('[TC_006] ném ForbiddenException khi user không có quyền truy cập', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const { context } = createExecutionContext({ role: Role.USER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  // TC_ROLES_GUARD_007
  it('[TC_007] ném ForbiddenException khi user.role là chuỗi nhưng không chứa role hợp lệ', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const { context } = createExecutionContext({ role: 'user,staff' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  // TC_ROLES_GUARD_008
  it('[TC_008] cho phép truy cập khi requiredRoles có nhiều giá trị và user có 1 role phù hợp', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.STAFF]);
    const { context } = createExecutionContext({ role: Role.STAFF });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  // TC_ROLES_GUARD_009
  it('[TC_009] ném ForbiddenException khi user.role là null', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const { context } = createExecutionContext({ role: null });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
