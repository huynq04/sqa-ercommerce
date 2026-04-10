import { Test, TestingModule } from '@nestjs/testing';
import { UserProductController } from '../controllers/user-product.controller';
import { UserProductService } from './user-product.service';
import { JwtService } from '@nestjs/jwt';

describe('UserProductController', () => {
  let controller: UserProductController;
  const mockProductService: any = {
    findAll: jest.fn(),
    findById: jest.fn(),
    logProductView: jest.fn().mockResolvedValue(undefined),
  };
  const mockJwt: any = { verify: jest.fn() };

  beforeEach(() => {
    controller = new UserProductController(mockProductService, mockJwt);
  });

  afterEach(() => jest.clearAllMocks());

  it('// TC-user-product-controller-001: getAll forwards query to service', async () => {
    // Arrange
    const query = { page: 1 } as any;
    (mockProductService.findAll as jest.Mock).mockResolvedValue({ items: [], total: 0 });
    // Act
    const res = await controller.getAll(query);
    // Assert
    expect(mockProductService.findAll).toHaveBeenCalledWith(query);
    expect(res).toEqual({ items: [], total: 0 });
  });

  it('// TC-user-product-controller-002: getOne returns product and logs view when token valid', async () => {
    // Arrange
    const prod = { id: 10 } as any;
    (mockProductService.findById as jest.Mock).mockResolvedValue(prod);
    mockJwt.verify.mockReturnValue({ sub: 5 });
    const req: any = { headers: { authorization: 'Bearer token123' } };

    // Act
    const res = await controller.getOne(10, req);

    // Assert
    expect(mockProductService.findById).toHaveBeenCalledWith(10);
    expect(mockProductService.logProductView).toHaveBeenCalledWith(5, 10);
    expect(res).toBe(prod);
  });
});