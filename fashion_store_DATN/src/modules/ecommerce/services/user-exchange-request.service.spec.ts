import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserExchangeRequestService } from './user-exchange-request.service';
import { ExchangeStatus } from '@modules/ecommerce/enums/exchangeStatus.enum';

describe('UserExchangeRequestService', () => {
  let service: UserExchangeRequestService;
  let exchangeRepo: any;
  let orderItemRepo: any;

  beforeEach(() => {
    exchangeRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    orderItemRepo = {
      findOne: jest.fn(),
    };

    service = new UserExchangeRequestService(exchangeRepo, orderItemRepo);
  });

  it('TC-RETURN-USER-SVC-001 should create pending exchange request successfully', async () => {
    const dto = { orderItemId: 10, reason: 'wrong size', images: ['img1'] } as any;
    const orderItem = { id: 10, order: { updatedAt: new Date() } };
    const created = { id: 1, ...dto, userId: 8, status: ExchangeStatus.PENDING };

    orderItemRepo.findOne.mockResolvedValue(orderItem);
    exchangeRepo.findOne.mockResolvedValue(null);
    exchangeRepo.create.mockReturnValue(created);
    exchangeRepo.save.mockResolvedValue(created);

    const result = await service.createReturn(dto, 8);

    expect(exchangeRepo.create).toHaveBeenCalledWith({
      ...dto,
      orderItemId: 10,
      userId: 8,
      status: ExchangeStatus.PENDING,
    });
    expect(result).toEqual(created);
  });

  it('TC-RETURN-USER-SVC-002 should throw when order item does not exist', async () => {
    orderItemRepo.findOne.mockResolvedValue(null);

    await expect(
      service.createReturn({ orderItemId: 99, reason: 'x' } as any, 2),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('TC-RETURN-USER-SVC-003 should throw when request is older than 7 days', async () => {
    const oldDate = new Date(Date.now() - 8 * 24 * 3600 * 1000);
    orderItemRepo.findOne.mockResolvedValue({ id: 1, order: { updatedAt: oldDate } });

    await expect(
      service.createReturn({ orderItemId: 1, reason: 'x' } as any, 3),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-RETURN-USER-SVC-004 should reject re-submission when existing request is rejected', async () => {
    orderItemRepo.findOne.mockResolvedValue({ id: 1, order: { updatedAt: new Date() } });
    exchangeRepo.findOne.mockResolvedValue({ id: 5, status: ExchangeStatus.REJECTED });

    await expect(
      service.createReturn({ orderItemId: 1, reason: 'x' } as any, 3),
    ).rejects.toThrow('Yêu cầu đổi hàng đã bị từ chối và không thể gửi lại');
  });

  it('TC-RETURN-USER-SVC-005 should reject when request already exists in non-rejected status', async () => {
    orderItemRepo.findOne.mockResolvedValue({ id: 1, order: { updatedAt: new Date() } });
    exchangeRepo.findOne.mockResolvedValue({ id: 5, status: ExchangeStatus.PENDING });

    await expect(
      service.createReturn({ orderItemId: 1, reason: 'x' } as any, 3),
    ).rejects.toThrow('Sản phẩm này đã có yêu cầu đổi hàng');
  });

  it('TC-RETURN-USER-SVC-006 should save orderItemId and userId correctly', async () => {
    const dto = { orderItemId: 55, reason: 'defect' } as any;

    orderItemRepo.findOne.mockResolvedValue({ id: 55, order: { updatedAt: new Date() } });
    exchangeRepo.findOne.mockResolvedValue(null);
    exchangeRepo.create.mockImplementation((payload: any) => payload);
    exchangeRepo.save.mockImplementation(async (payload: any) => payload);

    const result = await service.createReturn(dto, 101);

    expect(result.orderItemId).toBe(55);
    expect(result.userId).toBe(101);
  });

  it('TC-RETURN-USER-SVC-007 should keep reason and images from dto', async () => {
    const dto = {
      orderItemId: 12,
      reason: 'color mismatch',
      images: ['a.png', 'b.png'],
    } as any;

    orderItemRepo.findOne.mockResolvedValue({ id: 12, order: { updatedAt: new Date() } });
    exchangeRepo.findOne.mockResolvedValue(null);
    exchangeRepo.create.mockImplementation((payload: any) => payload);
    exchangeRepo.save.mockImplementation(async (payload: any) => payload);

    const result = await service.createReturn(dto, 2);

    expect(result.reason).toBe('color mismatch');
    expect(result.images).toEqual(['a.png', 'b.png']);
  });

  it('TC-RETURN-USER-SVC-008 should query listUserExchanges by userId with relations', async () => {
    exchangeRepo.find.mockResolvedValue([{ id: 1 }]);

    const result = await service.listUserExchanges(14);

    expect(exchangeRepo.find).toHaveBeenCalledWith({
      where: { userId: 14 },
      relations: ['orderItem'],
    });
    expect(result).toEqual([{ id: 1 }]);
  });

  it('TC-RETURN-USER-SVC-009 should allow request at 7-day boundary', async () => {
    const justInTime = new Date(Date.now() - 7 * 24 * 3600 * 1000 + 1000);
    orderItemRepo.findOne.mockResolvedValue({ id: 1, order: { updatedAt: justInTime } });
    exchangeRepo.findOne.mockResolvedValue(null);
    exchangeRepo.create.mockImplementation((payload: any) => payload);
    exchangeRepo.save.mockImplementation(async (payload: any) => ({ id: 1, ...payload }));

    const result = await service.createReturn(
      { orderItemId: 1, reason: 'boundary' } as any,
      9,
    );

    expect(result.status).toBe(ExchangeStatus.PENDING);
  });

  it('TC-RETURN-USER-SVC-010 should handle updatedAt string values', async () => {
    const recentIso = new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString();
    orderItemRepo.findOne.mockResolvedValue({ id: 1, order: { updatedAt: recentIso } });
    exchangeRepo.findOne.mockResolvedValue(null);
    exchangeRepo.create.mockImplementation((payload: any) => payload);
    exchangeRepo.save.mockImplementation(async (payload: any) => payload);

    const result = await service.createReturn(
      { orderItemId: 1, reason: 'date string' } as any,
      2,
    );

    expect(result.status).toBe(ExchangeStatus.PENDING);
  });

  it('TC-RETURN-USER-SVC-011 should propagate repository save errors', async () => {
    orderItemRepo.findOne.mockResolvedValue({ id: 1, order: { updatedAt: new Date() } });
    exchangeRepo.findOne.mockResolvedValue(null);
    exchangeRepo.create.mockReturnValue({ id: 1 });
    exchangeRepo.save.mockRejectedValue(new Error('save failed'));

    await expect(
      service.createReturn({ orderItemId: 1, reason: 'x' } as any, 3),
    ).rejects.toThrow('save failed');
  });

  it('TC-RETURN-USER-SVC-012 should return empty array when no exchange requests', async () => {
    exchangeRepo.find.mockResolvedValue([]);

    const result = await service.listUserExchanges(500);

    expect(result).toEqual([]);
  });
});
