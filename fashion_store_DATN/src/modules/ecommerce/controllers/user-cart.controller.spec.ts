import { UserCartController } from './user-cart.controller';
import { UserCartService } from '../services/user-cart.service';

describe('UserCartController', () => {
  let controller: UserCartController;
  let service: {
    getUserCart: jest.Mock;
    addItem: jest.Mock;
    updateItem: jest.Mock;
    removeItem: jest.Mock;
    clearCart: jest.Mock;
  };

  beforeEach(() => {
    service = {
      getUserCart: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
    };

    controller = new UserCartController(service as unknown as UserCartService);
  });

  it('TC-CART-CTRL-001 should forward getCart to service with req.user.sub', async () => {
    service.getUserCart.mockResolvedValue({ id: 1, items: [] });
    const req = { user: { sub: 11 } } as any;

    const result = await controller.getCart(req);

    expect(service.getUserCart).toHaveBeenCalledWith(11);
    expect(result).toEqual({ id: 1, items: [] });
  });

  it('TC-CART-CTRL-002 should forward add to service with user id and dto', async () => {
    const dto = { variantId: 5, quantity: 2 } as any;
    const req = { user: { sub: 19 } } as any;
    service.addItem.mockResolvedValue({ ok: true });

    const result = await controller.add(req, dto);

    expect(service.addItem).toHaveBeenCalledWith(19, dto);
    expect(result).toEqual({ ok: true });
  });

  it('TC-CART-CTRL-003 should forward update to service with item id and dto', async () => {
    const dto = { quantity: 3 } as any;
    service.updateItem.mockResolvedValue({ updated: true });

    const result = await controller.update(10 as any, dto);

    expect(service.updateItem).toHaveBeenCalledWith(10, dto);
    expect(result).toEqual({ updated: true });
  });

  it('TC-CART-CTRL-004 should forward remove to service with item id', async () => {
    service.removeItem.mockResolvedValue({ message: 'ok' });

    const result = await controller.remove(7 as any);

    expect(service.removeItem).toHaveBeenCalledWith(7);
    expect(result).toEqual({ message: 'ok' });
  });

  it('TC-CART-CTRL-005 should forward clear to service with req.user.sub', async () => {
    const req = { user: { sub: 44 } } as any;
    service.clearCart.mockResolvedValue({ message: 'cleared' });

    const result = await controller.clear(req);

    expect(service.clearCart).toHaveBeenCalledWith(44);
    expect(result).toEqual({ message: 'cleared' });
  });

  it('TC-CART-CTRL-006 should propagate getCart service error', async () => {
    service.getUserCart.mockRejectedValue(new Error('get cart failed'));

    await expect(controller.getCart({ user: { sub: 1 } } as any)).rejects.toThrow(
      'get cart failed',
    );
  });

  it('TC-CART-CTRL-007 should propagate add service error', async () => {
    service.addItem.mockRejectedValue(new Error('add failed'));

    await expect(
      controller.add({ user: { sub: 1 } } as any, { variantId: 1, quantity: 1 } as any),
    ).rejects.toThrow('add failed');
  });

  it('TC-CART-CTRL-008 should propagate update service error', async () => {
    service.updateItem.mockRejectedValue(new Error('update failed'));

    await expect(controller.update(3 as any, { quantity: 2 } as any)).rejects.toThrow(
      'update failed',
    );
  });
});
