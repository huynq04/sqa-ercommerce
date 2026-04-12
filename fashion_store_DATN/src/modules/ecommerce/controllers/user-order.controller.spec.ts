import { UserOrderController } from './user-order.controller';
import { UserOrderService } from '../services/user-order.service';

describe('UserOrderController', () => {
  let controller: UserOrderController;
  let service: {
    buyNow: jest.Mock;
    fromCart: jest.Mock;
    listUserOrders: jest.Mock;
    getOrderCommentStatus: jest.Mock;
    getOrderDetail: jest.Mock;
    getOrderTracking: jest.Mock;
  };

  beforeEach(() => {
    service = {
      buyNow: jest.fn(),
      fromCart: jest.fn(),
      listUserOrders: jest.fn(),
      getOrderCommentStatus: jest.fn(),
      getOrderDetail: jest.fn(),
      getOrderTracking: jest.fn(),
    };

    controller = new UserOrderController(service as unknown as UserOrderService);
  });

  it('TC-ORDER-CTRL-001 should forward buyNow request to service', async () => {
    const req = { user: { sub: 8 } } as any;
    const dto = { variantId: 5, quantity: 1, paymentMethod: 'cod' } as any;
    service.buyNow.mockResolvedValue({ id: 11 });

    const result = await controller.buyNow(req, dto);

    expect(service.buyNow).toHaveBeenCalledWith(8, dto);
    expect(result).toEqual({ id: 11 });
  });

  it('TC-ORDER-CTRL-002 should forward fromCart request to service', async () => {
    const req = { user: { sub: 9 } } as any;
    const dto = { paymentMethod: 'vnpay', shippingAddress: 'HN' } as any;
    service.fromCart.mockResolvedValue({ id: 12 });

    const result = await controller.fromCart(req, dto);

    expect(service.fromCart).toHaveBeenCalledWith(9, dto);
    expect(result).toEqual({ id: 12 });
  });

  it('TC-ORDER-CTRL-003 should forward getOrders with query', async () => {
    const req = { user: { sub: 10 } } as any;
    const query = { page: 1, limit: 10 } as any;
    service.listUserOrders.mockResolvedValue({ data: [], total: 0 });

    const result = await controller.getOrders(req, query);

    expect(service.listUserOrders).toHaveBeenCalledWith(10, query);
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('TC-ORDER-CTRL-004 should forward commentable to service', async () => {
    const req = { user: { sub: 20 } } as any;
    service.getOrderCommentStatus.mockResolvedValue({ orderId: 50 });

    const result = await controller.commentable(50, req);

    expect(service.getOrderCommentStatus).toHaveBeenCalledWith(20, 50);
    expect(result).toEqual({ orderId: 50 });
  });

  it('TC-ORDER-CTRL-005 should forward detail to service', async () => {
    const req = { user: { sub: 21 } } as any;
    service.getOrderDetail.mockResolvedValue({ id: 60 });

    const result = await controller.detail(60, req);

    expect(service.getOrderDetail).toHaveBeenCalledWith(21, 60);
    expect(result).toEqual({ id: 60 });
  });

  it('TC-ORDER-CTRL-006 should forward trackOrder to service', async () => {
    const req = { user: { sub: 22 } } as any;
    service.getOrderTracking.mockResolvedValue({ orderId: 61 });

    const result = await controller.trackOrder(61, req);

    expect(service.getOrderTracking).toHaveBeenCalledWith(22, 61);
    expect(result).toEqual({ orderId: 61 });
  });

  it('TC-ORDER-CTRL-007 should propagate buyNow service error', async () => {
    service.buyNow.mockRejectedValue(new Error('buy now failed'));

    await expect(
      controller.buyNow({ user: { sub: 1 } } as any, { variantId: 1, quantity: 1 } as any),
    ).rejects.toThrow('buy now failed');
  });

  it('TC-ORDER-CTRL-008 should propagate fromCart service error', async () => {
    service.fromCart.mockRejectedValue(new Error('from cart failed'));

    await expect(
      controller.fromCart({ user: { sub: 1 } } as any, { paymentMethod: 'cod' } as any),
    ).rejects.toThrow('from cart failed');
  });

  it('TC-ORDER-CTRL-009 should propagate detail service error', async () => {
    service.getOrderDetail.mockRejectedValue(new Error('detail failed'));

    await expect(controller.detail(1, { user: { sub: 1 } } as any)).rejects.toThrow(
      'detail failed',
    );
  });

  it('TC-ORDER-CTRL-010 should propagate tracking service error', async () => {
    service.getOrderTracking.mockRejectedValue(new Error('tracking failed'));

    await expect(controller.trackOrder(1, { user: { sub: 1 } } as any)).rejects.toThrow(
      'tracking failed',
    );
  });
});
