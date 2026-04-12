import { UserExchangeRequestController } from './user-exchange-request.controller';
import { UserExchangeRequestService } from '@modules/ecommerce/services/user-exchange-request.service';

describe('UserExchangeRequestController', () => {
  let controller: UserExchangeRequestController;
  let service: {
    createReturn: jest.Mock;
    listUserExchanges: jest.Mock;
  };

  beforeEach(() => {
    service = {
      createReturn: jest.fn(),
      listUserExchanges: jest.fn(),
    };

    controller = new UserExchangeRequestController(
      service as unknown as UserExchangeRequestService,
    );
  });

  it('TC-RETURN-USER-CTRL-001 should forward createReturn with user id', async () => {
    const dto = { orderItemId: 10, reason: 'size issue' } as any;
    const req = { user: { sub: 30 } } as any;
    service.createReturn.mockResolvedValue({ id: 1 });

    const result = await controller.createReturn(dto, req);

    expect(service.createReturn).toHaveBeenCalledWith(dto, 30);
    expect(result).toEqual({ id: 1 });
  });

  it('TC-RETURN-USER-CTRL-002 should forward listReturns with user id', async () => {
    const req = { user: { sub: 31 } } as any;
    service.listUserExchanges.mockResolvedValue([{ id: 2 }]);

    const result = await controller.listReturns(req);

    expect(service.listUserExchanges).toHaveBeenCalledWith(31);
    expect(result).toEqual([{ id: 2 }]);
  });

  it('TC-RETURN-USER-CTRL-003 should propagate createReturn error', async () => {
    service.createReturn.mockRejectedValue(new Error('create failed'));

    await expect(
      controller.createReturn({ orderItemId: 1, reason: 'x' } as any, {
        user: { sub: 1 },
      } as any),
    ).rejects.toThrow('create failed');
  });

  it('TC-RETURN-USER-CTRL-004 should propagate listReturns error', async () => {
    service.listUserExchanges.mockRejectedValue(new Error('list failed'));

    await expect(controller.listReturns({ user: { sub: 1 } } as any)).rejects.toThrow(
      'list failed',
    );
  });

  it('TC-RETURN-USER-CTRL-005 should pass dto unchanged to service', async () => {
    const dto = { orderItemId: 12, reason: 'defect', images: ['a.png'] } as any;
    service.createReturn.mockResolvedValue({ ok: true });

    await controller.createReturn(dto, { user: { sub: 5 } } as any);

    expect(service.createReturn).toHaveBeenCalledWith(dto, 5);
  });

  it('TC-RETURN-USER-CTRL-006 should return empty list from service', async () => {
    service.listUserExchanges.mockResolvedValue([]);

    const result = await controller.listReturns({ user: { sub: 88 } } as any);

    expect(result).toEqual([]);
  });
});
