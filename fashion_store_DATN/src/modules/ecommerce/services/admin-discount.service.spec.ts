// admin-discount.service.spec.ts
// Unit tests for AdminDiscountService
// Sử dụng Jest và @nestjs/testing

import { AdminDiscountService } from './admin-discount.service';
import { NotFoundException } from '@nestjs/common';

const mockDiscountRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('AdminDiscountService', () => {
  let service: AdminDiscountService;
  let discountRepo: ReturnType<typeof mockDiscountRepo>;

  beforeEach(() => {
    discountRepo = mockDiscountRepo();
    service = new AdminDiscountService(discountRepo as any);
  });

  // TC-BE-DISCOUNT-01: Lấy tất cả discount (success)
  it('should return all discounts', async () => {
    const discounts = [{ id: 1 }, { id: 2 }];
    discountRepo.find.mockResolvedValue(discounts);
    const result = await service.findAll();
    expect(discountRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    expect(result).toBe(discounts);
  });

  // TC-BE-DISCOUNT-02: Lấy discount theo id hợp lệ (success)
  it('should return discount by id', async () => {
    const discount = { id: 1 };
    discountRepo.findOne.mockResolvedValue(discount);
    const result = await service.findOne(1);
    expect(discountRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toBe(discount);
  });

  // TC-BE-DISCOUNT-03: Lấy discount không tồn tại (error)
  it('should throw NotFoundException if discount not found', async () => {
    discountRepo.findOne.mockResolvedValue(undefined);
    await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
  });

  // TC-BE-DISCOUNT-04: Tạo discount mới thành công (success)
  it('should create a new discount', async () => {
    const dto = { code: 'NEWCODE' };
    discountRepo.findOne.mockResolvedValue(undefined);
    const created = { id: 1, ...dto };
    discountRepo.create.mockReturnValue(created);
    discountRepo.save.mockResolvedValue(created);
    const result = await service.create(dto as any);
    expect(discountRepo.findOne).toHaveBeenCalledWith({ where: { code: dto.code } });
    expect(discountRepo.create).toHaveBeenCalledWith(dto);
    expect(discountRepo.save).toHaveBeenCalledWith(created);
    expect(result).toBe(created);
  });

  // TC-BE-DISCOUNT-05: Tạo discount bị trùng code (error)
  it('should throw NotFoundException if code exists', async () => {
    const dto = { code: 'EXIST' };
    discountRepo.findOne.mockResolvedValue({ id: 2, code: 'EXIST' });
    await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
  });

  // TC-BE-DISCOUNT-06: Update discount thành công (success)
  it('should update discount', async () => {
    const id = 1;
    const dto = { value: 10 };
    const discount = { id, code: 'A', value: 5 };
    discountRepo.findOne.mockResolvedValue(discount);
    discountRepo.save.mockResolvedValue({ ...discount, ...dto });
    const result = await service.update(id, dto as any);
    expect(result).toEqual({ ...discount, ...dto });
  });

  // TC-BE-DISCOUNT-07: Update discount không tồn tại (error)
  it('should throw NotFoundException if update target not found', async () => {
    discountRepo.findOne.mockResolvedValue(undefined);
    await expect(service.update(1, { value: 10 } as any)).rejects.toThrow(NotFoundException);
  });

  // TC-BE-DISCOUNT-08: Xóa discount thành công (success)
  it('should remove discount', async () => {
    const discount = { id: 1, code: 'DEL' };
    discountRepo.findOne.mockResolvedValue(discount);
    discountRepo.remove.mockResolvedValue(discount);
    const result = await service.remove(1);
    expect(discountRepo.remove).toHaveBeenCalledWith(discount);
    expect(result).toEqual({ message: `Đã xóa mã giảm giá "${discount.code}"` });
  });

  // TC-BE-DISCOUNT-09: Xóa discount không tồn tại (error)
  it('should throw NotFoundException if remove target not found', async () => {
    discountRepo.findOne.mockResolvedValue(undefined);
    await expect(service.remove(1)).rejects.toThrow(NotFoundException);
  });
});
