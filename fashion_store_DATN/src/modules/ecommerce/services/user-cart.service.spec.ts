import { NotFoundException } from '@nestjs/common';
import { UserCartService } from './user-cart.service';

const fullCartRelations = [
  'items',
  'items.variant',
  'items.variant.product',
  'items.variant.color',
  'items.variant.size',
];

describe('UserCartService', () => {
  let service: UserCartService;

  let cartRepo: any;
  let cartItemRepo: any;
  let variantRepo: any;

  beforeEach(() => {
    cartRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    cartItemRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    variantRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    service = new UserCartService(cartRepo, cartItemRepo, variantRepo);
  });

  it('TC-CART-SVC-001 should return existing cart after refresh', async () => {
    const cart = { id: 1, items: [{ quantity: 1, price: 10 }] };
    const refreshed = { id: 1, items: [{ quantity: 1, price: 10 }], totalPrice: 10 };

    cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(refreshed);
    const updateTotalSpy = jest
      .spyOn(service as any, 'updateCartTotal')
      .mockResolvedValue(undefined);

    const result = await service.getUserCart(7);

    expect(cartRepo.findOne).toHaveBeenNthCalledWith(1, {
      where: { user: { id: 7 } },
      relations: fullCartRelations,
    });
    expect(updateTotalSpy).toHaveBeenCalledWith(1);
    expect(result).toEqual(refreshed);
  });

  it('TC-CART-SVC-002 should create cart if user has no cart', async () => {
    const created = { id: 9, items: [], user: { id: 5 } };

    cartRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(created);
    cartRepo.create.mockReturnValue(created);
    cartRepo.save.mockResolvedValue(created);
    jest.spyOn(service as any, 'updateCartTotal').mockResolvedValue(undefined);

    const result = await service.getUserCart(5);

    expect(cartRepo.create).toHaveBeenCalledWith({ user: { id: 5 } });
    expect(cartRepo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });

  it('TC-CART-SVC-003 should query refreshed cart by created cart id', async () => {
    const created = { id: 12, items: [], user: { id: 11 } };

    cartRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(created);
    cartRepo.create.mockReturnValue(created);
    cartRepo.save.mockResolvedValue(created);
    jest.spyOn(service as any, 'updateCartTotal').mockResolvedValue(undefined);

    await service.getUserCart(11);

    expect(cartRepo.findOne).toHaveBeenNthCalledWith(2, {
      where: { id: 12 },
      relations: fullCartRelations,
    });
  });

  it('TC-CART-SVC-004 should return when updating total and cart not found', async () => {
    cartRepo.findOne.mockResolvedValue(null);

    await (service as any).updateCartTotal(100);

    expect(cartRepo.save).not.toHaveBeenCalled();
  });

  it('TC-CART-SVC-005 should compute total with numeric and string prices', async () => {
    const cart = {
      id: 1,
      items: [
        { price: 10, quantity: 2 },
        { price: '5.5', quantity: 3 },
      ],
      totalPrice: 0,
    };
    cartRepo.findOne.mockResolvedValue(cart);

    await (service as any).updateCartTotal(1);

    expect(cart.totalPrice).toBe(36.5);
    expect(cartRepo.save).toHaveBeenCalledWith(cart);
  });

  it('TC-CART-SVC-006 should compute total as 0 for empty cart items', async () => {
    const cart = { id: 1, items: [], totalPrice: 5 };
    cartRepo.findOne.mockResolvedValue(cart);

    await (service as any).updateCartTotal(1);

    expect(cart.totalPrice).toBe(0);
    expect(cartRepo.save).toHaveBeenCalledWith(cart);
  });

  it('TC-CART-SVC-007 should throw when addItem missing variantId', async () => {
    await expect(service.addItem(1, { quantity: 2 } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('TC-CART-SVC-008 should throw when addItem variant not found', async () => {
    jest.spyOn(service, 'getUserCart').mockResolvedValue({ id: 1, items: [] } as any);
    variantRepo.findOne.mockResolvedValue(null);

    await expect(
      service.addItem(1, { variantId: 2, quantity: 1 } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('TC-CART-SVC-009 should increase quantity for existing cart item', async () => {
    const existing = { id: 2, quantity: 2, cart: { id: 1 } };

    jest.spyOn(service, 'getUserCart').mockResolvedValue({ id: 1, items: [] } as any);
    jest.spyOn(service as any, 'updateCartTotal').mockResolvedValue(undefined);
    variantRepo.findOne.mockResolvedValue({ id: 8, price: 99, product: { id: 3 } });
    cartItemRepo.findOne.mockResolvedValue(existing);
    cartItemRepo.save.mockResolvedValue(existing);

    await service.addItem(1, { variantId: 8, quantity: 3 } as any);

    expect(existing.quantity).toBe(5);
    expect(cartItemRepo.save).toHaveBeenCalledWith(existing);
  });

  it('TC-CART-SVC-010 should create new item when item does not exist', async () => {
    const cart = { id: 1, items: [] };
    const variant = { id: 8, price: 199, product: { id: 6 } };
    const createdItem = { id: 11 };

    jest.spyOn(service, 'getUserCart').mockResolvedValue(cart as any);
    jest.spyOn(service as any, 'updateCartTotal').mockResolvedValue(undefined);
    variantRepo.findOne.mockResolvedValue(variant);
    cartItemRepo.findOne.mockResolvedValue(null);
    cartItemRepo.create.mockReturnValue(createdItem);

    await service.addItem(1, { variantId: 8, quantity: 2 } as any);

    expect(cartItemRepo.create).toHaveBeenCalledWith({
      cart,
      variant,
      quantity: 2,
      price: 199,
    });
    expect(cartItemRepo.save).toHaveBeenCalledWith(createdItem);
  });

  it('TC-CART-SVC-011 should call updateCartTotal and reload cart in addItem', async () => {
    const cart = { id: 4, items: [] };

    const getCartSpy = jest
      .spyOn(service, 'getUserCart')
      .mockResolvedValue(cart as any);
    const updateTotalSpy = jest
      .spyOn(service as any, 'updateCartTotal')
      .mockResolvedValue(undefined);

    variantRepo.findOne.mockResolvedValue({ id: 6, price: 88, product: { id: 1 } });
    cartItemRepo.findOne.mockResolvedValue(null);
    cartItemRepo.create.mockReturnValue({ id: 50 });
    cartItemRepo.save.mockResolvedValue({ id: 50 });

    await service.addItem(9, { variantId: 6, quantity: 1 } as any);

    expect(getCartSpy).toHaveBeenNthCalledWith(1, 9);
    expect(updateTotalSpy).toHaveBeenCalledWith(4);
    expect(getCartSpy).toHaveBeenNthCalledWith(2, 9);
  });

  it('TC-CART-SVC-012 should query existing item by cart and variant ids', async () => {
    jest.spyOn(service, 'getUserCart').mockResolvedValue({ id: 9, items: [] } as any);
    jest.spyOn(service as any, 'updateCartTotal').mockResolvedValue(undefined);
    variantRepo.findOne.mockResolvedValue({ id: 7, price: 30, product: { id: 2 } });
    cartItemRepo.findOne.mockResolvedValue(null);
    cartItemRepo.create.mockReturnValue({ id: 1 });

    await service.addItem(2, { variantId: 7, quantity: 2 } as any);

    expect(cartItemRepo.findOne).toHaveBeenCalledWith({
      where: { cart: { id: 9 }, variant: { id: 7 } },
      relations: ['cart'],
    });
  });

  it('TC-CART-SVC-013 should throw when updating missing item', async () => {
    cartItemRepo.findOne.mockResolvedValue(null);

    await expect(service.updateItem(9, { quantity: 3 } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('TC-CART-SVC-014 should update item quantity and return user cart', async () => {
    const item = { id: 5, quantity: 1, cart: { id: 2, user: { id: 77 } } };
    cartItemRepo.findOne.mockResolvedValue(item);
    cartItemRepo.save.mockResolvedValue(item);
    const updateTotalSpy = jest
      .spyOn(service as any, 'updateCartTotal')
      .mockResolvedValue(undefined);
    jest.spyOn(service, 'getUserCart').mockResolvedValue({ id: 2 } as any);

    const result = await service.updateItem(5, { quantity: 6 } as any);

    expect(item.quantity).toBe(6);
    expect(cartItemRepo.save).toHaveBeenCalledWith(item);
    expect(updateTotalSpy).toHaveBeenCalledWith(2);
    expect(result).toEqual({ id: 2 });
  });

  it('TC-CART-SVC-015 should load cart item relations when updating', async () => {
    cartItemRepo.findOne.mockResolvedValue({
      id: 2,
      quantity: 1,
      cart: { id: 1, user: { id: 1 } },
    });
    cartItemRepo.save.mockResolvedValue({});
    jest.spyOn(service as any, 'updateCartTotal').mockResolvedValue(undefined);
    jest.spyOn(service, 'getUserCart').mockResolvedValue({ id: 1 } as any);

    await service.updateItem(2, { quantity: 9 } as any);

    expect(cartItemRepo.findOne).toHaveBeenCalledWith({
      where: { id: 2 },
      relations: ['cart', 'cart.user'],
    });
  });

  it('TC-CART-SVC-016 should throw when removing missing item', async () => {
    cartItemRepo.findOne.mockResolvedValue(null);

    await expect(service.removeItem(2)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('TC-CART-SVC-017 should remove item and recalculate cart total', async () => {
    const item = { id: 3, cart: { id: 22 } };
    cartItemRepo.findOne.mockResolvedValue(item);
    cartItemRepo.remove.mockResolvedValue(undefined);
    const updateTotalSpy = jest
      .spyOn(service as any, 'updateCartTotal')
      .mockResolvedValue(undefined);

    const result = await service.removeItem(3);

    expect(cartItemRepo.remove).toHaveBeenCalledWith(item);
    expect(updateTotalSpy).toHaveBeenCalledWith(22);
    expect(result).toEqual({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
  });

  it('TC-CART-SVC-018 should load cart relation when removing item', async () => {
    cartItemRepo.findOne.mockResolvedValue({ id: 10, cart: { id: 1 } });
    cartItemRepo.remove.mockResolvedValue(undefined);
    jest.spyOn(service as any, 'updateCartTotal').mockResolvedValue(undefined);

    await service.removeItem(10);

    expect(cartItemRepo.findOne).toHaveBeenCalledWith({
      where: { id: 10 },
      relations: ['cart'],
    });
  });

  it('TC-CART-SVC-019 should clear cart items and set total to zero', async () => {
    const cart = { id: 1, items: [{ id: 1 }, { id: 2 }], totalPrice: 100 };
    jest.spyOn(service, 'getUserCart').mockResolvedValue(cart as any);
    cartItemRepo.remove.mockResolvedValue(undefined);
    cartRepo.save.mockResolvedValue(cart);

    const result = await service.clearCart(15);

    expect(cartItemRepo.remove).toHaveBeenCalledWith(cart.items);
    expect(cart.totalPrice).toBe(0);
    expect(cartRepo.save).toHaveBeenCalledWith(cart);
    expect(result).toEqual({ message: 'Đã xóa toàn bộ giỏ hàng' });
  });

  it('TC-CART-SVC-020 should handle clear cart when there are no items', async () => {
    const cart = { id: 1, items: [], totalPrice: 5 };
    jest.spyOn(service, 'getUserCart').mockResolvedValue(cart as any);

    await service.clearCart(16);

    expect(cartItemRepo.remove).toHaveBeenCalledWith([]);
    expect(cartRepo.save).toHaveBeenCalledWith({ ...cart, totalPrice: 0 });
  });

  it('TC-CART-SVC-021 should keep item quantity unchanged for zero-quantity add edge', async () => {
    const existing = { id: 2, quantity: 4, cart: { id: 1 } };

    jest.spyOn(service, 'getUserCart').mockResolvedValue({ id: 1, items: [] } as any);
    jest.spyOn(service as any, 'updateCartTotal').mockResolvedValue(undefined);
    variantRepo.findOne.mockResolvedValue({ id: 8, price: 99, product: { id: 3 } });
    cartItemRepo.findOne.mockResolvedValue(existing);

    await service.addItem(1, { variantId: 8, quantity: 0 } as any);

    expect(existing.quantity).toBe(4);
  });

  it('TC-CART-SVC-022 should include full relations in first cart query', async () => {
    cartRepo.findOne.mockResolvedValueOnce({ id: 9, items: [] }).mockResolvedValueOnce({
      id: 9,
      items: [],
    });
    jest.spyOn(service as any, 'updateCartTotal').mockResolvedValue(undefined);

    await service.getUserCart(12);

    expect(cartRepo.findOne).toHaveBeenNthCalledWith(1, {
      where: { user: { id: 12 } },
      relations: fullCartRelations,
    });
  });

  it('TC-CART-SVC-023 should include full relations in refreshed cart query', async () => {
    cartRepo.findOne.mockResolvedValueOnce({ id: 9, items: [] }).mockResolvedValueOnce({
      id: 9,
      items: [],
    });
    jest.spyOn(service as any, 'updateCartTotal').mockResolvedValue(undefined);

    await service.getUserCart(12);

    expect(cartRepo.findOne).toHaveBeenNthCalledWith(2, {
      where: { id: 9 },
      relations: fullCartRelations,
    });
  });

  it('TC-CART-SVC-024 should treat invalid price values as zero in total calculation', async () => {
    const cart = {
      id: 90,
      items: [
        { price: 'abc', quantity: 2 },
        { price: undefined, quantity: 4 },
      ],
      totalPrice: 100,
    };
    cartRepo.findOne.mockResolvedValue(cart);

    await (service as any).updateCartTotal(90);

    expect(cart.totalPrice).toBe(0);
    expect(cartRepo.save).toHaveBeenCalledWith(cart);
  });
});
