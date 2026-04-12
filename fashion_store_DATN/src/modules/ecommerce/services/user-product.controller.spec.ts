import { UserProductController } from '../controllers/user-product.controller';
import { UserProductService } from './user-product.service';
import { JwtService } from '@nestjs/jwt';

describe('UserProductController', () => {
  let controller: UserProductController;

  const mockProductService: Partial<UserProductService> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    // ✅ FIX QUAN TRỌNG: phải return Promise
    logProductView: jest.fn().mockResolvedValue(undefined),
  };

  const mockJwt: Partial<JwtService> = {
    verify: jest.fn(),
  };

  beforeEach(() => {
    controller = new UserProductController(
      mockProductService as UserProductService,
      mockJwt as JwtService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  // =========================
  // GET ALL
  // =========================
  it('TC-USER-PRODUCT-CONTROLLER-001 - should return all products with query', async () => {
    const query = { page: 1 } as any;

    (mockProductService.findAll as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
    });

    const res = await controller.getAll(query);

    expect(mockProductService.findAll).toHaveBeenCalledWith(query);
    expect(res).toEqual({ items: [], total: 0 });
  });

  // =========================
  // GET ONE - TOKEN VALID
  // =========================
  it('TC-USER-PRODUCT-CONTROLLER-002 - should return product and log view when token valid', async () => {
    const product = { id: 10 };

    (mockProductService.findById as jest.Mock).mockResolvedValue(product);
    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 5 });

    const req: any = {
      headers: { authorization: 'Bearer token123' },
    };

    const res = await controller.getOne(10, req);

    expect(mockProductService.findById).toHaveBeenCalledWith(10);
    expect(mockProductService.logProductView).toHaveBeenCalledWith(5, 10);
    expect(res).toEqual(product);
  });

  // =========================
  // NO TOKEN
  // =========================
  it('TC-USER-PRODUCT-CONTROLLER-003 - should NOT log view when no token', async () => {
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 1 });

    const req: any = { headers: {} };

    await controller.getOne(1, req);

    expect(mockProductService.logProductView).not.toHaveBeenCalled();
  });

  // =========================
  // INVALID TOKEN
  // =========================
  it('TC-USER-PRODUCT-CONTROLLER-004 - should NOT log view when token invalid', async () => {
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 1 });

    (mockJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    const req: any = {
      headers: { authorization: 'Bearer badtoken' },
    };

    await controller.getOne(1, req);

    expect(mockProductService.logProductView).not.toHaveBeenCalled();
  });

  // =========================
  // TOKEN FROM COOKIE
  // =========================
  it('TC-USER-PRODUCT-CONTROLLER-005 - should extract token from cookie', async () => {
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 1 });

    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 7 });

    const req: any = {
      headers: {
        cookie: 'token=abc123',
      },
    };

    await controller.getOne(1, req);

    expect(mockProductService.logProductView).toHaveBeenCalledWith(7, 1);
  });

  // =========================
  // PAYLOAD WITH ID
  // =========================
  it('TC-USER-PRODUCT-CONTROLLER-006 - should support payload.id', async () => {
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 1 });

    (mockJwt.verify as jest.Mock).mockReturnValue({ id: 9 });

    const req: any = {
      headers: { authorization: 'Bearer token' },
    };

    await controller.getOne(1, req);

    expect(mockProductService.logProductView).toHaveBeenCalledWith(9, 1);
  });

  // =========================
  // logProductView FAIL
  // =========================
  it('TC-USER-PRODUCT-CONTROLLER-007 - should not throw when logProductView fails', async () => {
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 1 });

    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 5 });

    (mockProductService.logProductView as jest.Mock).mockRejectedValue(
      new Error('fail'),
    );

    const req: any = {
      headers: { authorization: 'Bearer token' },
    };

    await expect(controller.getOne(1, req)).resolves.toEqual({ id: 1 });
  });

  // =========================
  // INVALID USER ID (NaN)
  // =========================
  it('TC-USER-PRODUCT-CONTROLLER-008 - should NOT log when userId is NaN', async () => {
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 1 });

    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 'abc' });

    const req: any = {
      headers: { authorization: 'Bearer token' },
    };

    await controller.getOne(1, req);

    expect(mockProductService.logProductView).not.toHaveBeenCalled();
  });

  it('TC-USER-PRODUCT-CONTROLLER-009 - getAll propagates service error', async () => {
    // TC-USER-PRODUCT-CONTROLLER-009: should propagate errors from service.findAll
    (mockProductService.findAll as jest.Mock).mockRejectedValue(new Error('findAll fail'));
    await expect(controller.getAll({} as any)).rejects.toThrow('findAll fail');
  });

  it('TC-USER-PRODUCT-CONTROLLER-010 - getOne propagates findById error', async () => {
    // TC-USER-PRODUCT-CONTROLLER-010: should propagate errors from service.findById
    (mockProductService.findById as jest.Mock).mockRejectedValue(new Error('not found'));
    const req: any = { headers: {} };
    await expect(controller.getOne(1, req)).rejects.toThrow('not found');
  });

  // TC-USER-PRODUCT-CONTROLLER-011: malformed bearer header does not trigger jwt verify or logging
  it('TC-USER-PRODUCT-CONTROLLER-011 - should not verify token when authorization header is malformed', async () => {
    // Arrange: product exists and malformed auth header (missing token part)
    // CheckDB: mocked - no DB touch
    // Act: call getOne
    // Assert: jwt verify and logProductView are not called
    // Rollback: mocked - nothing to rollback
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 3 });
    const req: any = { headers: { authorization: 'Bearer' } };

    await controller.getOne(3, req);

    expect(mockJwt.verify).not.toHaveBeenCalled();
    expect(mockProductService.logProductView).not.toHaveBeenCalled();
  });

  // TC-USER-PRODUCT-CONTROLLER-012: authorization header takes precedence over cookie token
  it('TC-USER-PRODUCT-CONTROLLER-012 - should prioritize authorization token over cookie token', async () => {
    // Arrange: provide both auth and cookie tokens with different payloads
    // CheckDB: mocked - no DB touch
    // Act: call getOne
    // Assert: logProductView uses user from authorization token
    // Rollback: mocked - nothing to rollback
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 4 });
    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 101 });
    const req: any = {
      headers: {
        authorization: 'Bearer auth-token',
        cookie: 'token=cookie-token',
      },
    };

    await controller.getOne(4, req);

    expect(mockJwt.verify).toHaveBeenCalledWith('auth-token', expect.any(Object));
    expect(mockProductService.logProductView).toHaveBeenCalledWith(101, 4);
  });

  // TC-USER-PRODUCT-CONTROLLERuser-product-controller-013: cookie without token key should not log view
  it('TC-USER-PRODUCT-CONTROLLER-013 - should not log view when cookie does not contain token key', async () => {
    // Arrange: valid product but cookie lacks token field
    // CheckDB: mocked - no DB touch
    // Act: call getOne
    // Assert: jwt verify/logProductView not called
    // Rollback: mocked - nothing to rollback
    (mockProductService.findById as jest.Mock).mockResolvedValue({ id: 5 });
    const req: any = { headers: { cookie: 'sessionId=abc123' } };

    await controller.getOne(5, req);

    expect(mockJwt.verify).not.toHaveBeenCalled();
    expect(mockProductService.logProductView).not.toHaveBeenCalled();
  });
});
