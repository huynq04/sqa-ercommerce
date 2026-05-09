// admin-discount.controller.spec.ts
// Unit tests for AdminDiscountController
// Sử dụng Jest và @nestjs/testing

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdminDiscountController } from './admin-discount.controller';
import { AdminDiscountService } from '../services/admin-discount.service';

const mockDiscountService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('AdminDiscountController', () => {
  let controller: AdminDiscountController;
  let service: typeof mockDiscountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDiscountController],
      providers: [
        { provide: AdminDiscountService, useValue: mockDiscountService },
      ],
    }).compile();

    controller = module.get<AdminDiscountController>(AdminDiscountController);
    service = module.get(AdminDiscountService);
    jest.clearAllMocks();
  });

  // TC-BE-DISCOUNT-CTRL-01: Lấy tất cả discount (success)
  it('should return all discounts', async () => {
    const expected = [{ id: 1 }];
    service.findAll.mockResolvedValue(expected);
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toBe(expected);
  });

  // TC-BE-DISCOUNT-CTRL-02: Lấy discount theo id (success)
  it('should return discount by id', async () => {
    const expected = { id: 1 };
    service.findOne.mockResolvedValue(expected);
    const result = await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toBe(expected);
  });

  // TC-BE-DISCOUNT-CTRL-03: Tạo discount mới (success)
  it('should create a new discount', async () => {
    const dto = { code: 'NEW' };
    const expected = { id: 1, ...dto };
    service.create.mockResolvedValue(expected);
    const result = await controller.create(dto as any);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  // TC-BE-DISCOUNT-CTRL-04: Update discount (success)
  it('should update discount', async () => {
    const dto = { value: 10 };
    const expected = { id: 1, ...dto };
    service.update.mockResolvedValue(expected);
    const result = await controller.update(1, dto as any);
    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toBe(expected);
  });

  // TC-BE-DISCOUNT-CTRL-05: Xóa discount (success)
  it('should remove discount', async () => {
    const expected = { message: 'deleted' };
    service.remove.mockResolvedValue(expected);
    const result = await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toBe(expected);
  });

  // TC-BE-DISCOUNT-CTRL-06: Service throw error (error)
  it('should throw error if service throws', async () => {
    service.findOne.mockRejectedValue(new Error('Service error'));
    await expect(controller.findOne(999)).rejects.toThrow('Service error');
  });

  // TC-BE-DISCOUNT-CTRL-07: id sai kiểu vẫn được truyền vào service (negative)
  it('should pass string id to service without validation', async () => {
    await expect(controller.findOne('abc' as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(service.findOne).not.toHaveBeenCalled();
  });

  // TC-BE-DISCOUNT-CTRL-08: dto rỗng vẫn được truyền vào service (negative)
  it('should pass empty dto to service on create', async () => {
    await expect(controller.create({} as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(service.create).not.toHaveBeenCalled();
  });
});
