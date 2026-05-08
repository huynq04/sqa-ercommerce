import { AdminExchangeRequestController } from './admin-exchange-request.controller';
import { AdminExchangeRequestService } from '@modules/ecommerce/services/admin-exchange-request.service';

describe('AdminExchangeRequestController', () => {
  let controller: AdminExchangeRequestController;
  let service: {
    getReturnById: jest.Mock;
    approveReturn: jest.Mock;
    rejectReturn: jest.Mock;
    receiveReturn: jest.Mock;
    completeReturn: jest.Mock;
    listAllReturns: jest.Mock;
  };

  beforeEach(() => {
    service = {
      getReturnById: jest.fn(),
      approveReturn: jest.fn(),
      rejectReturn: jest.fn(),
      receiveReturn: jest.fn(),
      completeReturn: jest.fn(),
      listAllReturns: jest.fn(),
    };

    controller = new AdminExchangeRequestController(
      service as unknown as AdminExchangeRequestService,
    );
  });

  it('TC-RETURN-ADMIN-CTRL-001 should forward getReturnById', async () => {
    service.getReturnById.mockResolvedValue({ id: 1 });

    const result = await controller.getReturnById(1 as any);

    expect(service.getReturnById).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1 });
  });

  it('TC-RETURN-ADMIN-CTRL-002 should forward approveReturn', async () => {
    service.approveReturn.mockResolvedValue({ id: 2, status: 'approved' });

    const result = await controller.approveReturn(2 as any);

    expect(service.approveReturn).toHaveBeenCalledWith(2);
    expect(result).toEqual({ id: 2, status: 'approved' });
  });

  it('TC-RETURN-ADMIN-CTRL-003 should forward rejectReturn', async () => {
    const dto = { reason: 'invalid' } as any;
    service.rejectReturn.mockResolvedValue({ id: 3, status: 'rejected' });

    const result = await controller.rejectReturn(3 as any, dto);

    expect(service.rejectReturn).toHaveBeenCalledWith(3, dto);
    expect(result).toEqual({ id: 3, status: 'rejected' });
  });

  it('TC-RETURN-ADMIN-CTRL-004 should forward receiveReturn', async () => {
    service.receiveReturn.mockResolvedValue({ message: 'ok' });

    const result = await controller.receiveReturn(4 as any);

    expect(service.receiveReturn).toHaveBeenCalledWith(4);
    expect(result).toEqual({ message: 'ok' });
  });

  it('TC-RETURN-ADMIN-CTRL-005 should forward completeReturn', async () => {
    service.completeReturn.mockResolvedValue({ id: 5, status: 'completed' });

    const result = await controller.completeReturn(5 as any);

    expect(service.completeReturn).toHaveBeenCalledWith(5);
    expect(result).toEqual({ id: 5, status: 'completed' });
  });

  it('TC-RETURN-ADMIN-CTRL-006 should forward listAllReturns', async () => {
    service.listAllReturns.mockResolvedValue([{ id: 6 }]);

    const result = await controller.listAllReturns();

    expect(service.listAllReturns).toHaveBeenCalled();
    expect(result).toEqual([{ id: 6 }]);
  });

  it('TC-RETURN-ADMIN-CTRL-007 should propagate getReturnById errors', async () => {
    service.getReturnById.mockRejectedValue(new Error('not found'));

    await expect(controller.getReturnById(999 as any)).rejects.toThrow('not found');
  });

  it('TC-RETURN-ADMIN-CTRL-008 should propagate rejectReturn errors', async () => {
    service.rejectReturn.mockRejectedValue(new Error('reject failed'));

    await expect(
      controller.rejectReturn(99 as any, { reason: 'x' } as any),
    ).rejects.toThrow('reject failed');
  });
});
