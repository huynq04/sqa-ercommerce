import { BadRequestException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { AddToCartDto, UpdateCartDto } from '../dtos/cart.dto';
import { BuyNowDto, CreateOrderDto } from '../dtos/order.dto';
import { CreateReturnDto } from '../dtos/return-exchange.dto';
import { UserCartController } from '../controllers/user-cart.controller';
import { UserOrderController } from '../controllers/user-order.controller';
import { UserExchangeRequestController } from '../controllers/user-exchange-request.controller';
import { UserCartService } from './user-cart.service';
import { UserOrderService } from './user-order.service';
import { AdminOrderService } from './admin-order.service';
import { ShipmentSyncService } from './shipment-sync.service';
import { UserExchangeRequestService } from './user-exchange-request.service';
import { AdminExchangeRequestService } from './admin-exchange-request.service';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@modules/ecommerce/entities/order.entity';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';
import { ExchangeStatus } from '@modules/ecommerce/enums/exchangeStatus.enum';

const validationPropertyNames = async (dto: object) => {
  const errors = await validate(dto as any);
  return errors.map((error) => error.property);
};

describe('Cart, Checkout, Order, Payment, Shipping, Return - mock unit tests', () => {
  let cartRepo: any;
  let cartItemRepo: any;
  let variantRepo: any;
  let orderRepo: any;
  let orderItemRepo: any;
  let productRepo: any;
  let discountRepo: any;
  let shipmentRepo: any;
  let historyRepo: any;
  let exchangeRepo: any;
  let vnpayService: any;
  let redisService: any;
  let ghnService: any;
  let mailerService: any;

  let cartService: UserCartService;
  let orderService: UserOrderService;
  let adminOrderService: AdminOrderService;
  let shipmentSyncService: ShipmentSyncService;
  let userExchangeService: UserExchangeRequestService;
  let adminExchangeService: AdminExchangeRequestService;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    cartRepo = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      remove: jest.fn(async (value) => value),
      manager: { remove: jest.fn(async (value) => value) },
    };
    cartItemRepo = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      remove: jest.fn(async (value) => value),
    };
    variantRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (value) => value),
      increment: jest.fn(async () => ({ affected: 1 })),
    };
    orderRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (value) => value),
      create: jest.fn((value) => value),
      createQueryBuilder: jest.fn(),
    };
    orderItemRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      find: jest.fn(),
    };
    productRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (value) => value),
      increment: jest.fn(async () => ({ affected: 1 })),
    };
    discountRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    shipmentRepo = {
      save: jest.fn(async (value) => value),
      findOne: jest.fn(),
      create: jest.fn((value) => value),
    };
    historyRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (value) => value),
    };
    exchangeRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
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
    ghnService = {
      getOrderInfo: jest.fn(),
      createShippingOrderExchange: jest.fn(),
    };
    mailerService = {
      sendMail: jest.fn(async () => undefined),
    };

    cartService = new UserCartService(cartRepo, cartItemRepo, variantRepo);
    orderService = new UserOrderService(
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
    adminOrderService = new AdminOrderService(orderRepo);
    shipmentSyncService = new ShipmentSyncService(
      shipmentRepo,
      historyRepo,
      orderRepo,
      ghnService,
      orderItemRepo,
      variantRepo,
      productRepo,
    );
    userExchangeService = new UserExchangeRequestService(
      exchangeRepo,
      orderItemRepo,
    );
    adminExchangeService = new AdminExchangeRequestService(
      exchangeRepo,
      ghnService,
      shipmentRepo,
      variantRepo,
      mailerService,
      productRepo,
      orderService,
    );
  });

  afterEach(() => {
    // Rollback for mock tests: clear every stubbed dependency between test cases.
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  // Test Case ID: TC_MOCK_CART_DTO_001
  it('[TC_MOCK_CART_DTO_001] validates AddToCartDto with positive integer quantity', async () => {
    const dto = plainToInstance(AddToCartDto, { variantId: 1, quantity: 2 });

    expect(await validate(dto)).toHaveLength(0);
  });

  // Test Case ID: TC_MOCK_CART_DTO_002
  it('[TC_MOCK_CART_DTO_002] rejects AddToCartDto when quantity is zero', async () => {
    const dto = plainToInstance(AddToCartDto, { variantId: 1, quantity: 0 });

    expect(await validationPropertyNames(dto)).toContain('quantity');
  });

  // Test Case ID: TC_MOCK_CART_DTO_003
  it('[TC_MOCK_CART_DTO_003] rejects AddToCartDto when variantId is not an integer', async () => {
    const dto = plainToInstance(AddToCartDto, {
      variantId: 'abc',
      quantity: 1,
    });

    expect(await validationPropertyNames(dto)).toContain('variantId');
  });

  // Test Case ID: TC_MOCK_CART_DTO_004
  it('[TC_MOCK_CART_DTO_004] validates UpdateCartDto with positive quantity', async () => {
    const dto = plainToInstance(UpdateCartDto, { quantity: 5 });

    expect(await validate(dto)).toHaveLength(0);
  });

  // Test Case ID: TC_MOCK_CART_DTO_005
  it('[TC_MOCK_CART_DTO_005] rejects UpdateCartDto with negative quantity', async () => {
    const dto = plainToInstance(UpdateCartDto, { quantity: -1 });

    expect(await validationPropertyNames(dto)).toContain('quantity');
  });

  // Test Case ID: TC_MOCK_ORDER_DTO_001
  it('[TC_MOCK_ORDER_DTO_001] validates CreateOrderDto for COD checkout', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      paymentMethod: PaymentMethod.COD,
      shippingAddress: 'Ha Noi',
      shippingFee: 0,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  // Test Case ID: TC_MOCK_ORDER_DTO_002
  it('[TC_MOCK_ORDER_DTO_002] rejects CreateOrderDto with invalid payment method', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      paymentMethod: 'cash',
      shippingAddress: 'Ha Noi',
    });

    expect(await validationPropertyNames(dto)).toContain('paymentMethod');
  });

  // Test Case ID: TC_MOCK_ORDER_DTO_003
  it('[TC_MOCK_ORDER_DTO_003] rejects CreateOrderDto with negative shipping fee', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      paymentMethod: PaymentMethod.COD,
      shippingAddress: 'Ha Noi',
      shippingFee: -1,
    });

    expect(await validationPropertyNames(dto)).toContain('shippingFee');
  });

  // Test Case ID: TC_MOCK_ORDER_DTO_004
  it('[TC_MOCK_ORDER_DTO_004] validates BuyNowDto with variantId and quantity', async () => {
    const dto = plainToInstance(BuyNowDto, {
      variantId: 11,
      quantity: 1,
      paymentMethod: PaymentMethod.VNPAY,
      shippingAddress: 'Ha Noi',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  // Test Case ID: TC_MOCK_ORDER_DTO_005
  it('[TC_MOCK_ORDER_DTO_005] rejects BuyNowDto when quantity is not positive', async () => {
    const dto = plainToInstance(BuyNowDto, {
      variantId: 11,
      quantity: 0,
      paymentMethod: PaymentMethod.VNPAY,
      shippingAddress: 'Ha Noi',
    });

    expect(await validationPropertyNames(dto)).toContain('quantity');
  });

  // Test Case ID: TC_MOCK_RETURN_DTO_001
  it('[TC_MOCK_RETURN_DTO_001] validates CreateReturnDto with reason and images', async () => {
    const dto = plainToInstance(CreateReturnDto, {
      orderItemId: 1,
      reason: 'Wrong size',
      images: ['image.png'],
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  // Test Case ID: TC_MOCK_RETURN_DTO_002
  it('[TC_MOCK_RETURN_DTO_002] rejects CreateReturnDto when reason is empty', async () => {
    const dto = plainToInstance(CreateReturnDto, {
      orderItemId: 1,
      reason: '',
    });

    expect(await validationPropertyNames(dto)).toContain('reason');
  });

  // Test Case ID: TC_MOCK_CART_CTRL_001
  it('[TC_MOCK_CART_CTRL_001] UserCartController forwards getCart to service with authenticated user id', () => {
    const service = { getUserCart: jest.fn(() => ({ id: 1 })) } as any;
    const controller = new UserCartController(service);

    expect(controller.getCart({ user: { sub: 7 } })).toEqual({ id: 1 });
    expect(service.getUserCart).toHaveBeenCalledWith(7);
  });

  // Test Case ID: TC_MOCK_CART_CTRL_002
  it('[TC_MOCK_CART_CTRL_002] UserCartController forwards add dto to service', () => {
    const service = { addItem: jest.fn(() => ({ id: 1 })) } as any;
    const controller = new UserCartController(service);

    controller.add({ user: { sub: 7 } }, { variantId: 2, quantity: 1 });

    expect(service.addItem).toHaveBeenCalledWith(7, {
      variantId: 2,
      quantity: 1,
    });
  });

  // Test Case ID: TC_MOCK_ORDER_CTRL_001
  it('[TC_MOCK_ORDER_CTRL_001] UserOrderController forwards buyNow payload', () => {
    const service = { buyNow: jest.fn(() => ({ id: 1 })) } as any;
    const controller = new UserOrderController(service);
    const dto = { variantId: 1, quantity: 1, paymentMethod: PaymentMethod.COD };

    controller.buyNow({ user: { sub: 3 } }, dto as any);

    expect(service.buyNow).toHaveBeenCalledWith(3, dto);
  });

  // Test Case ID: TC_MOCK_ORDER_CTRL_002
  it('[TC_MOCK_ORDER_CTRL_002] UserOrderController forwards fromCart payload', () => {
    const service = { fromCart: jest.fn(() => ({ id: 1 })) } as any;
    const controller = new UserOrderController(service);
    const dto = { paymentMethod: PaymentMethod.COD, shippingAddress: 'HN' };

    controller.fromCart({ user: { sub: 3 } }, dto as any);

    expect(service.fromCart).toHaveBeenCalledWith(3, dto);
  });

  // Test Case ID: TC_MOCK_ORDER_CTRL_003
  it('[TC_MOCK_ORDER_CTRL_003] UserOrderController forwards list query', () => {
    const service = { listUserOrders: jest.fn(() => ({ data: [] })) } as any;
    const controller = new UserOrderController(service);

    controller.getOrders({ user: { sub: 3 } }, { page: 1 } as any);

    expect(service.listUserOrders).toHaveBeenCalledWith(3, { page: 1 });
  });

  // Test Case ID: TC_MOCK_RETURN_CTRL_001
  it('[TC_MOCK_RETURN_CTRL_001] UserExchangeRequestController forwards createReturn', () => {
    const service = { createReturn: jest.fn(() => ({ id: 1 })) } as any;
    const controller = new UserExchangeRequestController(service);
    const dto = { orderItemId: 1, reason: 'Wrong size' };

    controller.createReturn(dto as any, { user: { sub: 5 } });

    expect(service.createReturn).toHaveBeenCalledWith(dto, 5);
  });

  // Test Case ID: TC_MOCK_CART_SERVICE_001
  it('[TC_MOCK_CART_SERVICE_001] addItem throws when variantId is missing', async () => {
    await expect(
      cartService.addItem(1, { quantity: 1 } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Test Case ID: TC_MOCK_CART_SERVICE_002
  it('[TC_MOCK_CART_SERVICE_002] addItem throws when variant is not found', async () => {
    jest
      .spyOn(cartService, 'getUserCart')
      .mockResolvedValue({ id: 1, items: [] } as any);
    variantRepo.findOne.mockResolvedValue(null);

    await expect(
      cartService.addItem(1, { variantId: 99, quantity: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Test Case ID: TC_MOCK_CART_SERVICE_003
  it('[TC_MOCK_CART_SERVICE_003] removeItem throws when item is not found', async () => {
    cartItemRepo.findOne.mockResolvedValue(null);

    await expect(cartService.removeItem(1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Test Case ID: TC_MOCK_ORDER_SERVICE_001
  it('[TC_MOCK_ORDER_SERVICE_001] fromCart throws when cart is empty', async () => {
    cartRepo.findOne.mockResolvedValue({ id: 1, items: [] });

    await expect(
      orderService.fromCart(1, {
        paymentMethod: PaymentMethod.COD,
        shippingAddress: 'HN',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Test Case ID: TC_MOCK_ORDER_SERVICE_002
  it('[TC_MOCK_ORDER_SERVICE_002] listUserOrders sets search fields and default sort before paginating', async () => {
    const listSpy = jest
      .spyOn(orderService, 'listPaginate')
      .mockResolvedValue({ data: [], meta: { total: 0 } } as any);
    const query: any = { page: 1, limit: 10 };

    await orderService.listUserOrders(8, query);

    expect(query.searchFields).toEqual(['shippingAddress', 'status']);
    expect(query.sort).toEqual({ createdAt: -1 });
    expect(listSpy).toHaveBeenCalledWith(query, {
      where: { user_id: 8 },
      relations: ['items', 'items.variant', 'items.variant.product'],
    });
  });

  // Test Case ID: TC_MOCK_ORDER_SERVICE_003
  it('[TC_MOCK_ORDER_SERVICE_003] handlePaymentCallback returns not found response for unknown order', async () => {
    orderRepo.findOne.mockResolvedValue(null);

    await expect(
      orderService.handlePaymentCallback(404, '00', 100000),
    ).resolves.toEqual({
      RspCode: '01',
      Message: 'Order not found',
    });
  });

  // Test Case ID: TC_MOCK_ORDER_SERVICE_004
  it('[TC_MOCK_ORDER_SERVICE_004] lockProduct initializes Redis stock key and reserves quantity', async () => {
    redisService.get.mockResolvedValue(undefined);
    redisService.incrBy.mockResolvedValue(3);

    await orderService.lockProduct({ cart: { quantity: 2 } }, {
      id: 10,
      stock: 5,
    } as any);

    expect(redisService.setNx).toHaveBeenCalledWith('stock:variant:10', 5, 300);
    expect(redisService.incrBy).toHaveBeenCalledWith('stock:variant:10', -2);
    expect(redisService.expire).toHaveBeenCalledWith('stock:variant:10', 300);
  });

  // Test Case ID: TC_MOCK_ORDER_SERVICE_005
  it('[TC_MOCK_ORDER_SERVICE_005] lockProduct throws when available stock is insufficient', async () => {
    redisService.get.mockResolvedValue(1);

    await expect(
      orderService.lockProduct({ cart: { quantity: 2 } }, {
        id: 10,
        stock: 5,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // Test Case ID: TC_MOCK_ORDER_SERVICE_006
  it('[TC_MOCK_ORDER_SERVICE_006] getOrderTracking sorts histories by occurredAt', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 9,
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      shipmentStatus: ShipmentStatus.READY_TO_PICK,
      shipments: [
        {
          id: 1,
          type: 'order',
          ghnOrderCode: 'GHN-1',
          shipmentStatus: ShipmentStatus.DELIVERING,
          histories: [
            {
              shipmentStatus: ShipmentStatus.DELIVERING,
              ghnStatus: 'delivering',
              occurredAt: new Date('2025-01-02'),
            },
            {
              shipmentStatus: ShipmentStatus.PICKED,
              ghnStatus: 'picked',
              occurredAt: new Date('2025-01-01'),
            },
          ],
        },
      ],
    });

    const result = await orderService.getOrderTracking(1, 9);

    expect(
      result.shipments[0].histories.map((history) => history.status),
    ).toEqual([ShipmentStatus.PICKED, ShipmentStatus.DELIVERING]);
  });

  // Test Case ID: TC_MOCK_ORDER_SERVICE_007
  it('[TC_MOCK_ORDER_SERVICE_007] getOrderTracking throws when order does not belong to user', async () => {
    orderRepo.findOne.mockResolvedValue(null);

    await expect(orderService.getOrderTracking(1, 9)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Test Case ID: TC_MOCK_ADMIN_ORDER_SERVICE_001
  it('[TC_MOCK_ADMIN_ORDER_SERVICE_001] AdminOrderService listAll configures search fields and default order', async () => {
    const listSpy = jest
      .spyOn(adminOrderService, 'listPaginate')
      .mockResolvedValue({ data: [], meta: { total: 0 } } as any);
    const query: any = { page: 1 };

    await adminOrderService.listAll(query);

    expect(query.searchFields).toEqual(['shippingAddress', 'status']);
    expect(listSpy).toHaveBeenCalledWith(query, {
      relations: ['user', 'items', 'items.variant', 'items.variant.product'],
      order: { createdAt: 'DESC' },
    });
  });

  // Test Case ID: TC_MOCK_SHIPPING_SERVICE_001
  it('[TC_MOCK_SHIPPING_SERVICE_001] syncShipment skips fake ABC shipment code', async () => {
    await shipmentSyncService.syncShipment({ ghnOrderCode: 'ABC' } as any);

    expect(ghnService.getOrderInfo).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_MOCK_SHIPPING_SERVICE_002
  it('[TC_MOCK_SHIPPING_SERVICE_002] syncShipment returns when GHN has no logs', async () => {
    ghnService.getOrderInfo.mockResolvedValue({ data: { log: [] } });

    await shipmentSyncService.syncShipment({
      id: 1,
      ghnOrderCode: 'GHN-1',
    } as any);

    expect(historyRepo.save).not.toHaveBeenCalled();
    expect(shipmentRepo.save).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_MOCK_SHIPPING_SERVICE_003
  it('[TC_MOCK_SHIPPING_SERVICE_003] syncShipment skips an existing shipment history status', async () => {
    ghnService.getOrderInfo.mockResolvedValue({
      data: {
        log: [{ status: ShipmentStatus.DELIVERED, updated_date: '2025-01-01' }],
      },
    });
    historyRepo.findOne.mockResolvedValue({ id: 1 });

    await shipmentSyncService.syncShipment({
      id: 1,
      ghnOrderCode: 'GHN-1',
    } as any);

    expect(historyRepo.save).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_MOCK_SHIPPING_SERVICE_004
  it('[TC_MOCK_SHIPPING_SERVICE_004] applyOrderBusiness ignores non-order shipments', async () => {
    await shipmentSyncService.applyOrderBusiness({
      type: 'exchange_pickup',
    } as any);

    expect(orderRepo.findOne).not.toHaveBeenCalled();
  });

  // Test Case ID: TC_MOCK_SHIPPING_SERVICE_005
  it('[TC_MOCK_SHIPPING_SERVICE_005] applyOrderBusiness only updates shipment status for in-progress delivery', async () => {
    const order = { id: 1, shipmentStatus: ShipmentStatus.READY_TO_PICK };
    orderRepo.findOne.mockResolvedValue(order);

    await shipmentSyncService.applyOrderBusiness({
      type: 'order',
      orderId: 1,
      shipmentStatus: ShipmentStatus.DELIVERING,
    } as any);

    expect(order.shipmentStatus).toBe(ShipmentStatus.DELIVERING);
    expect(orderRepo.save).toHaveBeenCalledWith(order);
  });

  // Test Case ID: TC_MOCK_RETURN_SERVICE_001
  it('[TC_MOCK_RETURN_SERVICE_001] createReturn throws when order item does not exist', async () => {
    orderItemRepo.findOne = jest.fn().mockResolvedValue(null);

    await expect(
      userExchangeService.createReturn(
        { orderItemId: 1, reason: 'Wrong size' },
        2,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Test Case ID: TC_MOCK_RETURN_SERVICE_002
  it('[TC_MOCK_RETURN_SERVICE_002] createReturn rejects requests older than seven days', async () => {
    orderItemRepo.findOne = jest.fn().mockResolvedValue({
      id: 1,
      order: { updatedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000) },
    });

    await expect(
      userExchangeService.createReturn(
        { orderItemId: 1, reason: 'Wrong size' },
        2,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // Test Case ID: TC_MOCK_RETURN_SERVICE_003
  it('[TC_MOCK_RETURN_SERVICE_003] createReturn rejects an already rejected duplicate request', async () => {
    orderItemRepo.findOne = jest.fn().mockResolvedValue({
      id: 1,
      order: { updatedAt: new Date() },
    });
    exchangeRepo.findOne.mockResolvedValue({ status: ExchangeStatus.REJECTED });

    await expect(
      userExchangeService.createReturn(
        { orderItemId: 1, reason: 'Wrong size' },
        2,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // Test Case ID: TC_MOCK_RETURN_SERVICE_004
  it('[TC_MOCK_RETURN_SERVICE_004] listUserExchanges reads requests by user id with order item relation', async () => {
    exchangeRepo.find.mockResolvedValue([{ id: 1 }]);

    await expect(userExchangeService.listUserExchanges(2)).resolves.toEqual([
      { id: 1 },
    ]);
    expect(exchangeRepo.find).toHaveBeenCalledWith({
      where: { userId: 2 },
      relations: ['orderItem'],
    });
  });

  // Test Case ID: TC_MOCK_RETURN_SERVICE_005
  it('[TC_MOCK_RETURN_SERVICE_005] approveReturn throws when request is rejected', async () => {
    exchangeRepo.findOne.mockResolvedValue({ status: ExchangeStatus.REJECTED });

    await expect(adminExchangeService.approveReturn(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  // Test Case ID: TC_MOCK_RETURN_SERVICE_006
  it('[TC_MOCK_RETURN_SERVICE_006] receiveReturn sends email and returns message when replacement stock cannot be locked', async () => {
    const lockSpy = jest
      .spyOn(orderService, 'lockProduct')
      .mockRejectedValue(new BadRequestException('no stock'));
    exchangeRepo.findOne.mockResolvedValue({
      id: 1,
      status: ExchangeStatus.APPROVED,
      user: { email: 'user@example.com' },
      orderItem: {
        quantity: 1,
        variant: { id: 10, product: { name: 'Product' } },
        order: { shipments: [{ type: 'order', ghnOrderCode: 'GHN-1' }] },
      },
    });

    const result = await adminExchangeService.receiveReturn(1);

    expect(lockSpy).toHaveBeenCalled();
    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com' }),
    );
    expect(result.message).toContain('Sản phẩm tạm hết hàng');
  });
});
