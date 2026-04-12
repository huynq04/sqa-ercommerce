import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserOrderService } from './user-order.service';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@modules/ecommerce/entities/order.entity';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';

describe('UserOrderService', () => {
  let service: UserOrderService;

  let orderRepo: any;
  let orderItemRepo: any;
  let cartRepo: any;
  let productRepo: any;
  let variantRepo: any;
  let discountRepo: any;
  let vnpayService: any;
  let redisService: any;
  let shipmentRepo: any;

  beforeEach(() => {
    orderRepo = {
      create: jest.fn((payload: any) => payload),
      save: jest.fn(async (payload: any) => ({ id: payload.id ?? 100, ...payload })),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    orderItemRepo = {
      create: jest.fn((payload: any) => payload),
      save: jest.fn(async (payload: any) => payload),
      find: jest.fn(),
    };

    cartRepo = {
      findOne: jest.fn(),
      remove: jest.fn(),
      manager: {
        remove: jest.fn(),
      },
    };

    productRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (payload: any) => payload),
    };

    variantRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (payload: any) => payload),
    };

    discountRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    vnpayService = {
      createPaymentUrl: jest.fn(),
    };

    redisService = {
      get: jest.fn(),
      setNx: jest.fn(),
      incrBy: jest.fn(),
      expire: jest.fn(),
    };

    shipmentRepo = {
      save: jest.fn(async (payload: any) => payload),
    };

    service = new UserOrderService(
      orderRepo,
      orderItemRepo,
      cartRepo,
      productRepo,
      variantRepo,
      discountRepo,
      vnpayService,
      redisService,
      shipmentRepo,
    );
  });

  const baseVariant = () => ({
    id: 1,
    price: 100,
    stock: 10,
    product: {
      id: 50,
      stock: 20,
      name: 'Sneaker',
    },
  });

  describe('buyNow', () => {
    it('TC-ORDER-SVC-001 should create COD order successfully', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      const lockSpy = jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      const shipmentSpy = jest
        .spyOn(service as any, 'createShipmentForOrder')
        .mockResolvedValue(undefined);

      const result: any = await service.buyNow(10, {
        variantId: 1,
        quantity: 2,
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
      } as any);

      expect(lockSpy).toHaveBeenCalled();
      expect(shipmentSpy).toHaveBeenCalled();
      expect(result.id).toBe(100);
      expect(result.paymentStatus).toBe(PaymentStatus.UNPAID);
    });

    it('TC-ORDER-SVC-002 should decrement variant and product stock for COD', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      await service.buyNow(1, {
        variantId: 1,
        quantity: 3,
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HCM',
      } as any);

      expect(variant.stock).toBe(7);
      expect(product.stock).toBe(17);
      expect(variantRepo.save).toHaveBeenCalledWith(variant);
      expect(productRepo.save).toHaveBeenCalledWith(product);
    });

    it('TC-ORDER-SVC-003 should return VNPay url for VNPay orders', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      orderRepo.findOne.mockResolvedValue({ vnpTransDate: 'T1', vnpTxnRef: 'R1' });
      vnpayService.createPaymentUrl.mockResolvedValue('https://pay.example');
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      const result: any = await service.buyNow(1, {
        variantId: 1,
        quantity: 1,
        paymentMethod: PaymentMethod.VNPAY,
        shippingAddress: 'DN',
      } as any);

      expect(result.payUrl).toBe('https://pay.example');
      expect(result.order.paymentMethod).toBe(PaymentMethod.VNPAY);
      expect(result.order.paymentStatus).toBe(PaymentStatus.PENDING);
    });

    it('TC-ORDER-SVC-004 should return fallback response when VNPay url creation fails', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      vnpayService.createPaymentUrl.mockRejectedValue(new Error('vnp timeout'));
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      const result: any = await service.buyNow(1, {
        variantId: 1,
        quantity: 1,
        paymentMethod: PaymentMethod.VNPAY,
        shippingAddress: 'Hue',
      } as any);

      expect(result.payUrl).toBeNull();
      expect(result.message).toContain('Không thể tạo link thanh toán VNPay');
    });

    it('TC-ORDER-SVC-005 should apply discount and update usage in buyNow', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);
      const validateSpy = jest
        .spyOn(service as any, 'validateDiscount')
        .mockResolvedValue({ id: 1, discountPercent: 10 });
      const usageSpy = jest
        .spyOn(service as any, 'applyDiscountUsage')
        .mockResolvedValue(undefined);

      await service.buyNow(3, {
        variantId: 1,
        quantity: 2,
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HP',
        discountCode: 'SAVE10',
      } as any);

      expect(validateSpy).toHaveBeenCalledWith('SAVE10');
      expect(usageSpy).toHaveBeenCalled();
      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 180 }),
      );
    });

    it('TC-ORDER-SVC-006 should throw when discount validation fails in buyNow', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'validateDiscount')
        .mockRejectedValue(new NotFoundException('invalid code'));

      await expect(
        service.buyNow(2, {
          variantId: 1,
          quantity: 1,
          paymentMethod: PaymentMethod.COD,
          shippingAddress: 'HN',
          discountCode: 'BAD',
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('TC-ORDER-SVC-007 should clamp negative shipping fee to zero in buyNow', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      await service.buyNow(2, {
        variantId: 1,
        quantity: 1,
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
        shippingFee: -100,
      } as any);

      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 100 }),
      );
    });

    it('TC-ORDER-SVC-008 should clamp invalid shipping fee to zero in buyNow', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      await service.buyNow(2, {
        variantId: 1,
        quantity: 1,
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
        shippingFee: 'abc',
      } as any);

      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 100 }),
      );
    });

    it('TC-ORDER-SVC-009 should call lockProduct with requested quantity in buyNow', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      const lockSpy = jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      await service.buyNow(8, {
        variantId: 1,
        quantity: 4,
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
      } as any);

      expect(lockSpy).toHaveBeenCalledWith({ cart: { quantity: 4 } }, variant);
    });

    it('TC-ORDER-SVC-010 should create shipment for order in buyNow', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      const shipmentSpy = jest
        .spyOn(service as any, 'createShipmentForOrder')
        .mockResolvedValue(undefined);

      await service.buyNow(8, {
        variantId: 1,
        quantity: 1,
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
      } as any);

      expect(shipmentSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 100 }));
    });

    it('TC-ORDER-SVC-011 should create order item with variant price in buyNow', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      await service.buyNow(8, {
        variantId: 1,
        quantity: 2,
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
      } as any);

      expect(orderItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 2, price: 100 }),
      );
      expect(orderItemRepo.save).toHaveBeenCalled();
    });

    it('TC-ORDER-SVC-012 should not decrement stock immediately for VNPay in buyNow', async () => {
      const variant = baseVariant();
      const product = variant.product;

      variantRepo.findOne.mockResolvedValue(variant);
      productRepo.findOne.mockResolvedValue(product);
      orderRepo.findOne.mockResolvedValue({ vnpTransDate: 'T1', vnpTxnRef: 'R1' });
      vnpayService.createPaymentUrl.mockResolvedValue('https://pay.example');
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      await service.buyNow(9, {
        variantId: 1,
        quantity: 2,
        paymentMethod: PaymentMethod.VNPAY,
        shippingAddress: 'HN',
      } as any);

      expect(variantRepo.save).not.toHaveBeenCalled();
      expect(productRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('fromCart', () => {
    const cartItemFactory = () => [
      {
        quantity: 2,
        price: 50,
        variant: { id: 1, stock: 10, product: { id: 11, stock: 20 } },
      },
      {
        quantity: 1,
        price: 120,
        variant: { id: 2, stock: 8, product: { id: 12, stock: 15 } },
      },
    ];

    it('TC-ORDER-SVC-013 should throw when cart is missing', async () => {
      cartRepo.findOne.mockResolvedValue(null);

      await expect(
        service.fromCart(1, {
          paymentMethod: PaymentMethod.COD,
          shippingAddress: 'HN',
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('TC-ORDER-SVC-014 should throw when cart has no items', async () => {
      cartRepo.findOne.mockResolvedValue({ id: 1, items: [] });

      await expect(
        service.fromCart(1, {
          paymentMethod: PaymentMethod.COD,
          shippingAddress: 'HN',
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('TC-ORDER-SVC-015 should lock stock for each cart item', async () => {
      const cart = { id: 1, items: cartItemFactory() };
      cartRepo.findOne.mockResolvedValue(cart);
      const lockSpy = jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      await service.fromCart(1, {
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
      } as any);

      expect(lockSpy).toHaveBeenCalledTimes(2);
    });

    it('TC-ORDER-SVC-016 should decrement stock for all cart items in COD flow', async () => {
      const items = cartItemFactory();
      const cart = { id: 1, items };
      cartRepo.findOne.mockResolvedValue(cart);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      await service.fromCart(1, {
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
      } as any);

      expect(items[0].variant.stock).toBe(8);
      expect(items[0].variant.product.stock).toBe(18);
      expect(items[1].variant.stock).toBe(7);
      expect(items[1].variant.product.stock).toBe(14);
      expect(variantRepo.save).toHaveBeenCalledTimes(2);
      expect(productRepo.save).toHaveBeenCalledTimes(2);
    });

    it('TC-ORDER-SVC-017 should clear cart items and cart after placing order from cart', async () => {
      const cart = { id: 1, items: cartItemFactory() };
      cartRepo.findOne.mockResolvedValue(cart);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      await service.fromCart(1, {
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
      } as any);

      expect(cartRepo.manager.remove).toHaveBeenCalledWith(cart.items);
      expect(cartRepo.remove).toHaveBeenCalledWith(cart);
    });

    it('TC-ORDER-SVC-018 should create order items for each cart line', async () => {
      const cart = { id: 1, items: cartItemFactory() };
      cartRepo.findOne.mockResolvedValue(cart);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      await service.fromCart(1, {
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
      } as any);

      expect(orderItemRepo.create).toHaveBeenCalledTimes(2);
      expect(orderItemRepo.save).toHaveBeenCalledTimes(2);
    });

    it('TC-ORDER-SVC-019 should return payUrl for VNPay orders from cart', async () => {
      const cart = { id: 1, items: cartItemFactory() };
      cartRepo.findOne.mockResolvedValue(cart);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);
      orderRepo.findOne.mockResolvedValue({ vnpTransDate: 'T1', vnpTxnRef: 'R1' });
      vnpayService.createPaymentUrl.mockResolvedValue('https://vnpay');

      const result: any = await service.fromCart(1, {
        paymentMethod: PaymentMethod.VNPAY,
        shippingAddress: 'HN',
      } as any);

      expect(result.payUrl).toBe('https://vnpay');
    });

    it('TC-ORDER-SVC-020 should return fallback payload when VNPay creation fails from cart', async () => {
      const cart = { id: 1, items: cartItemFactory() };
      cartRepo.findOne.mockResolvedValue(cart);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);
      vnpayService.createPaymentUrl.mockRejectedValue(new Error('vnp fail'));

      const result: any = await service.fromCart(1, {
        paymentMethod: PaymentMethod.VNPAY,
        shippingAddress: 'HN',
      } as any);

      expect(result.payUrl).toBeNull();
      expect(result.message).toContain('Không thể tạo link thanh toán VNPay');
    });

    it('TC-ORDER-SVC-021 should apply discount usage in fromCart flow', async () => {
      const cart = { id: 1, items: cartItemFactory() };
      cartRepo.findOne.mockResolvedValue(cart);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);
      const validateSpy = jest
        .spyOn(service as any, 'validateDiscount')
        .mockResolvedValue({ id: 1, discountPercent: 10 });
      const usageSpy = jest
        .spyOn(service as any, 'applyDiscountUsage')
        .mockResolvedValue(undefined);

      await service.fromCart(1, {
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
        discountCode: 'SAVE10',
      } as any);

      expect(validateSpy).toHaveBeenCalledWith('SAVE10');
      expect(usageSpy).toHaveBeenCalled();
    });

    it('TC-ORDER-SVC-022 should clamp negative shipping fee in fromCart flow', async () => {
      const cart = { id: 1, items: cartItemFactory() };
      cartRepo.findOne.mockResolvedValue(cart);
      jest.spyOn(service, 'lockProduct').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createShipmentForOrder').mockResolvedValue(undefined);

      await service.fromCart(1, {
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
        shippingFee: -99,
      } as any);

      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 220 }),
      );
    });
  });

  describe('list + discount internals', () => {
    it('TC-ORDER-SVC-023 should set default search fields and sort when listing user orders', async () => {
      const listSpy = jest
        .spyOn(service, 'listPaginate')
        .mockResolvedValue({ data: [], total: 0 } as any);
      const query = { page: 1, limit: 10 } as any;

      await service.listUserOrders(99, query);

      expect(query.searchFields).toEqual(['shippingAddress', 'status']);
      expect(query.sort).toEqual({ createdAt: -1 });
      expect(listSpy).toHaveBeenCalledWith(query, {
        where: { user_id: 99 },
        relations: ['items', 'items.variant', 'items.variant.product'],
      });
    });

    it('TC-ORDER-SVC-024 should keep existing sort when listing user orders', async () => {
      const listSpy = jest
        .spyOn(service, 'listPaginate')
        .mockResolvedValue({ data: [], total: 0 } as any);
      const query = { page: 1, limit: 10, sort: { totalAmount: 1 } } as any;

      await service.listUserOrders(88, query);

      expect(query.sort).toEqual({ totalAmount: 1 });
      expect(listSpy).toHaveBeenCalled();
    });

    it('TC-ORDER-SVC-025 should increase discount usedCount when usage update succeeds', async () => {
      const execute = jest.fn().mockResolvedValue({ affected: 1 });
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      discountRepo.createQueryBuilder.mockReturnValue({ update });

      await (service as any).applyDiscountUsage({ id: 7 });

      expect(update).toHaveBeenCalled();
      expect(set).toHaveBeenCalledWith({ usedCount: expect.any(Function) });
      expect(execute).toHaveBeenCalled();
    });

    it('TC-ORDER-SVC-026 should throw when discount usage update affects no row', async () => {
      const execute = jest.fn().mockResolvedValue({ affected: 0 });
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      discountRepo.createQueryBuilder.mockReturnValue({ update });

      await expect((service as any).applyDiscountUsage({ id: 7 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('TC-ORDER-SVC-027 should throw when discount code does not exist', async () => {
      discountRepo.findOne.mockResolvedValue(null);

      await expect((service as any).validateDiscount('NOPE')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('TC-ORDER-SVC-028 should throw when discount has expired', async () => {
      const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000);
      discountRepo.findOne.mockResolvedValue({
        id: 1,
        code: 'EXPIRED',
        startDate: twoDaysAgo,
        endDate: yesterday,
        usageLimit: 0,
        usedCount: 0,
      });

      await expect((service as any).validateDiscount('EXPIRED')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('TC-ORDER-SVC-029 should throw when discount usage limit is reached', async () => {
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
      const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
      discountRepo.findOne.mockResolvedValue({
        id: 1,
        code: 'LIMIT',
        startDate: yesterday,
        endDate: tomorrow,
        usageLimit: 2,
        usedCount: 2,
      });

      await expect((service as any).validateDiscount('LIMIT')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('TC-ORDER-SVC-030 should return discount when code is valid', async () => {
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
      const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
      const discount = {
        id: 2,
        code: 'OK',
        discountPercent: 20,
        startDate: yesterday,
        endDate: tomorrow,
        usageLimit: 0,
        usedCount: 99,
      };
      discountRepo.findOne.mockResolvedValue(discount);

      const result = await (service as any).validateDiscount('OK');

      expect(result).toEqual(discount);
    });
  });

  describe('payment callback', () => {
    it('TC-ORDER-SVC-031 should return not found response for missing order', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      const result = await service.handlePaymentCallback(1, '00', 1000);

      expect(result).toEqual({ RspCode: '01', Message: 'Order not found' });
    });

    it('TC-ORDER-SVC-032 should return already paid response for paid order', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, paymentStatus: PaymentStatus.PAID });

      const result = await service.handlePaymentCallback(1, '00', 1000);

      expect(result).toEqual({ RspCode: '02', Message: 'Order already paid' });
    });

    it('TC-ORDER-SVC-033 should mark order paid and confirmed for success response', async () => {
      const order = { id: 1, paymentStatus: PaymentStatus.PENDING } as any;
      orderRepo.findOne.mockResolvedValue(order);

      const result = await service.handlePaymentCallback(1, '00', 1000);

      expect(order.paymentStatus).toBe(PaymentStatus.PAID);
      expect(order.orderStatus).toBe(OrderStatus.CONFIRMED);
      expect(orderRepo.save).toHaveBeenCalledWith(order);
      expect(result).toEqual({ RspCode: '00', Message: 'Confirm Success' });
    });

    it('TC-ORDER-SVC-034 should mark order failed and cancelled for failed response', async () => {
      const order = { id: 1, paymentStatus: PaymentStatus.PENDING } as any;
      orderRepo.findOne.mockResolvedValue(order);

      const result = await service.handlePaymentCallback(1, '24', 1000);

      expect(order.paymentStatus).toBe(PaymentStatus.FAILED);
      expect(order.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(orderRepo.save).toHaveBeenCalledWith(order);
      expect(result).toEqual({ RspCode: '00', Message: 'Confirm Success' });
    });
  });

  describe('order detail/comment/tracking', () => {
    it('TC-ORDER-SVC-035 should throw when order detail is not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.getOrderDetail(1, 100)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('TC-ORDER-SVC-036 should return order detail with relations', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 20, items: [] });

      const result = await service.getOrderDetail(1, 20);

      expect(result).toEqual({ id: 20, items: [] });
      expect(orderRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 20, user: { id: 1 } } }),
      );
    });

    it('TC-ORDER-SVC-037 should throw when comment status order is not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.getOrderCommentStatus(1, 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('TC-ORDER-SVC-038 should map commentable status correctly', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 30,
        orderStatus: OrderStatus.COMPLETED,
        shipmentStatus: ShipmentStatus.DELIVERED,
        items: [
          {
            id: 1,
            variant: { id: 100, product: { id: 200, name: 'Jacket' } },
            review: null,
          },
          {
            id: 2,
            variant: { id: 101, product: { id: 201, name: 'Hat' } },
            review: { id: 5, rating: 5 },
          },
        ],
      });

      const result = await service.getOrderCommentStatus(1, 30);

      expect(result.items[0]).toEqual(
        expect.objectContaining({ canComment: true, reviewed: false, review: null }),
      );
      expect(result.items[1]).toEqual(
        expect.objectContaining({ canComment: false, reviewed: true }),
      );
    });

    it('TC-ORDER-SVC-039 should throw when tracking order is not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.getOrderTracking(1, 2)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('TC-ORDER-SVC-040 should sort tracking histories ascending by occurredAt', async () => {
      const late = new Date('2026-01-01T10:00:00Z');
      const early = new Date('2026-01-01T08:00:00Z');

      orderRepo.findOne.mockResolvedValue({
        id: 40,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        shipmentStatus: ShipmentStatus.SORTING,
        shipments: [
          {
            id: 1,
            type: 'order',
            ghnOrderCode: 'GHN40',
            shipmentStatus: ShipmentStatus.SORTING,
            histories: [
              {
                shipmentStatus: ShipmentStatus.SORTING,
                ghnStatus: 'sorting',
                occurredAt: late,
              },
              {
                shipmentStatus: ShipmentStatus.PICKED,
                ghnStatus: 'picked',
                occurredAt: early,
              },
            ],
          },
        ],
      });

      const result = await service.getOrderTracking(1, 40);

      expect(result.shipments[0].histories[0].occurredAt).toEqual(early);
      expect(result.shipments[0].histories[1].occurredAt).toEqual(late);
    });
  });

  describe('stock lock + shipment helper', () => {
    it('TC-ORDER-SVC-041 should initialize stock key and expire when cache is empty', async () => {
      redisService.get.mockResolvedValue(null);
      redisService.setNx.mockResolvedValue(true);
      redisService.incrBy.mockResolvedValue(7);
      redisService.expire.mockResolvedValue(undefined);

      await service.lockProduct(
        { cart: { quantity: 3 } },
        { id: 12, stock: 10 } as any,
      );

      expect(redisService.setNx).toHaveBeenCalledWith('stock:variant:12', 10, 300);
      expect(redisService.incrBy).toHaveBeenCalledWith('stock:variant:12', -3);
      expect(redisService.expire).toHaveBeenCalledWith('stock:variant:12', 300);
    });

    it('TC-ORDER-SVC-042 should throw when requested quantity is greater than available stock', async () => {
      redisService.get.mockResolvedValue('2');

      await expect(
        service.lockProduct({ cart: { quantity: 3 } }, { id: 2, stock: 10 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('TC-ORDER-SVC-043 should throw when concurrent lock makes stock negative', async () => {
      redisService.get.mockResolvedValue('5');
      redisService.incrBy.mockResolvedValue(-1);

      await expect(
        service.lockProduct({ cart: { quantity: 3 } }, { id: 2, stock: 10 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('TC-ORDER-SVC-044 should save default shipment when creating shipment for order', async () => {
      await (service as any).createShipmentForOrder({ id: 55 });

      expect(shipmentRepo.save).toHaveBeenCalledWith({
        orderId: 55,
        shipmentStatus: ShipmentStatus.READY_TO_PICK,
        ghnOrderCode: 'ABC',
        type: 'order',
      });
    });
  });
});
