import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminExchangeRequestService } from './admin-exchange-request.service';
import { ExchangeStatus } from '@modules/ecommerce/enums/exchangeStatus.enum';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';

describe('AdminExchangeRequestService', () => {
  let service: AdminExchangeRequestService;

  let exchangeRepo: any;
  let ghnService: any;
  let shipmentRepo: any;
  let variantRepo: any;
  let mailerService: any;
  let productRepo: any;
  let orderService: any;

  beforeEach(() => {
    exchangeRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    ghnService = {
      getOrderInfo: jest.fn(),
      createShippingOrderExchange: jest.fn(),
    };

    shipmentRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    variantRepo = {
      save: jest.fn(),
    };

    mailerService = {
      sendMail: jest.fn(),
    };

    productRepo = {
      save: jest.fn(),
    };

    orderService = {
      lockProduct: jest.fn(),
    };

    service = new AdminExchangeRequestService(
      exchangeRepo,
      ghnService,
      shipmentRepo,
      variantRepo,
      mailerService,
      productRepo,
      orderService,
    );
  });

  it('TC-RETURN-ADMIN-SVC-001 should throw when approving and request not found', async () => {
    exchangeRepo.findOne.mockResolvedValue(null);

    await expect(service.approveReturn(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('TC-RETURN-ADMIN-SVC-002 should throw when approving rejected request', async () => {
    exchangeRepo.findOne.mockResolvedValue({ id: 1, status: ExchangeStatus.REJECTED });

    await expect(service.approveReturn(1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-RETURN-ADMIN-SVC-003 should throw when approving non-pending request', async () => {
    exchangeRepo.findOne.mockResolvedValue({ id: 1, status: ExchangeStatus.APPROVED });

    await expect(service.approveReturn(1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-RETURN-ADMIN-SVC-004 should throw when original order shipment is missing', async () => {
    const rr = {
      id: 9,
      status: ExchangeStatus.PENDING,
      orderItem: { order: { id: 33 } },
    };

    exchangeRepo.findOne.mockResolvedValue(rr);
    shipmentRepo.findOne.mockResolvedValue(null);

    await expect(service.approveReturn(9)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TC-RETURN-ADMIN-SVC-005 should approve request and create exchange pickup shipment', async () => {
    const rr = {
      id: 9,
      status: ExchangeStatus.PENDING,
      orderItem: { order: { id: 33 } },
    } as any;

    exchangeRepo.findOne.mockResolvedValue(rr);
    shipmentRepo.findOne.mockResolvedValue({ id: 7, ghnOrderCode: 'GHN_OLD' });
    ghnService.getOrderInfo.mockResolvedValue({
      data: {
        return_name: 'SHOP',
        return_phone: '0901',
        return_address: 'Shop address',
        return_ward_code: '001',
        return_district_id: 10,
        to_phone: '0911',
        to_address: 'User address',
        to_ward_code: '002',
        to_district_id: 20,
        items: [
          {
            name: 'Item A',
            quantity: 1,
            price: 100,
            weight: 200,
            length: 10,
            width: 10,
            height: 10,
          },
        ],
        weight: 200,
        length: 10,
        width: 10,
        height: 10,
      },
    });
    ghnService.createShippingOrderExchange.mockResolvedValue({
      data: { order_code: 'EX_PICKUP_1' },
    });
    shipmentRepo.create.mockImplementation((payload: any) => payload);
    shipmentRepo.save.mockResolvedValue({});
    exchangeRepo.save.mockImplementation(async (payload: any) => payload);

    const result = await service.approveReturn(9);

    expect(shipmentRepo.create).toHaveBeenCalledWith({
      orderId: 33,
      exchangeRequestId: 9,
      ghnOrderCode: 'EX_PICKUP_1',
      type: 'exchange_pickup',
      shipmentStatus: ShipmentStatus.READY_TO_PICK,
    });
    expect(result.status).toBe(ExchangeStatus.APPROVED);
  });

  it('TC-RETURN-ADMIN-SVC-006 should reject request with reason', async () => {
    const rr = { id: 2, status: ExchangeStatus.PENDING };
    exchangeRepo.findOne.mockResolvedValue(rr);
    exchangeRepo.save.mockImplementation(async (payload: any) => payload);

    const result = await service.rejectReturn(2, { reason: 'invalid' } as any);

    expect(result.status).toBe(ExchangeStatus.REJECTED);
    expect(result.rejectReason).toBe('invalid');
  });

  it('TC-RETURN-ADMIN-SVC-007 should throw when receiveReturn request not found', async () => {
    exchangeRepo.findOne.mockResolvedValue(null);

    await expect(service.receiveReturn(5)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('TC-RETURN-ADMIN-SVC-008 should short-circuit receiveReturn when status is shipping_new', async () => {
    exchangeRepo.findOne.mockResolvedValue({ id: 1, status: ExchangeStatus.SHIPPING_NEW });

    const result = await service.receiveReturn(1);

    expect(result).toEqual({ message: 'Đã gửi hàng cho khách' });
    expect(orderService.lockProduct).not.toHaveBeenCalled();
  });

  it('TC-RETURN-ADMIN-SVC-009 should send out-of-stock mail when lockProduct fails', async () => {
    const rr = {
      id: 3,
      status: ExchangeStatus.APPROVED,
      user: { email: 'user@test.com' },
      orderItem: {
        quantity: 2,
        variant: {
          id: 99,
          stock: 0,
          product: { id: 12, name: 'Sneaker' },
        },
        order: {
          id: 90,
          shipments: [{ type: 'order', ghnOrderCode: 'GHN1' }],
        },
      },
    } as any;

    exchangeRepo.findOne.mockResolvedValue(rr);
    exchangeRepo.save.mockImplementation(async (payload: any) => payload);
    orderService.lockProduct.mockRejectedValue(new Error('no stock'));

    const result = await service.receiveReturn(3);

    expect(mailerService.sendMail).toHaveBeenCalled();
    expect(result).toEqual({
      message:
        'Đã nhận hàng đổi. Sản phẩm tạm hết hàng, đã gửi mail thông báo cho khách.',
    });
  });

  it('TC-RETURN-ADMIN-SVC-010 should throw when getReturnById does not exist', async () => {
    exchangeRepo.findOne.mockResolvedValue(null);

    await expect(service.getReturnById(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});
