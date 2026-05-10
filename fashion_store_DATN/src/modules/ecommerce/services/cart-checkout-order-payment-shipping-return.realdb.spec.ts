import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner, Repository } from 'typeorm';

import { config } from '@config/config.service';
import { Role } from '@modules/auth/role.enum';
import { User } from '@modules/user/entities/user.entity';
import { Cart } from '@modules/ecommerce/entities/cart.entity';
import { CartItem } from '@modules/ecommerce/entities/cartItem.entity';
import { Category } from '@modules/ecommerce/entities/category.entity';
import { DiscountCode } from '@modules/ecommerce/entities/discountCode.entity';
import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@modules/ecommerce/entities/order.entity';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { ProductColor } from '@modules/ecommerce/entities/productColor.entity';
import { ProductImage } from '@modules/ecommerce/entities/productImage.entity';
import { ProductReview } from '@modules/ecommerce/entities/productReview.entity';
import { ProductSize } from '@modules/ecommerce/entities/productSize.entity';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { ShipmentHistory } from '@modules/ecommerce/entities/shipmentHistory.entity';
import { ShipmentOrder } from '@modules/ecommerce/entities/shipmentOrder.entity';
import { ExchangeRequest } from '@modules/ecommerce/entities/exchangeRequest.entity';
import { ActivityLog } from '@modules/ecommerce/entities/activityLog.entity';
import { AiVector } from '@modules/ecommerce/entities/aiVector.entity';
import { AiRecommendationVector } from '@modules/ecommerce/entities/aiRecommendationVector.entity';
import { Notification } from '@modules/ecommerce/entities/notification.entity';
import { PolicyDocument } from '@modules/ecommerce/entities/policyDocument.entity';
import { UserCartService } from './user-cart.service';
import { UserOrderService } from './user-order.service';
import { AdminOrderService } from './admin-order.service';
import { ShipmentSyncService } from './shipment-sync.service';
import { UserExchangeRequestService } from './user-exchange-request.service';
import { AdminExchangeRequestService } from './admin-exchange-request.service';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';
import { ExchangeStatus } from '@modules/ecommerce/enums/exchangeStatus.enum';

type RedisMock = {
  store: Map<string, number | string>;
  get: jest.Mock;
  setNx: jest.Mock;
  incrBy: jest.Mock;
  expire: jest.Mock;
};

const trackedEmails: string[] = [];
let uniqueCounter = 0;

const nextKey = (prefix: string) => {
  uniqueCounter += 1;
  return `${prefix}_${Date.now()}_${uniqueCounter}`;
};

const buildRedisMock = (): RedisMock => {
  const store = new Map<string, number | string>();
  return {
    store,
    get: jest.fn(async (key: string) => store.get(key)),
    setNx: jest.fn(async (key: string, value: number | string) => {
      if (!store.has(key)) store.set(key, value);
      return true;
    }),
    incrBy: jest.fn(async (key: string, value: number) => {
      const current = Number(store.get(key) ?? 0);
      const next = current + value;
      store.set(key, next);
      return next;
    }),
    expire: jest.fn(async () => true),
  };
};

describe('Cart, Checkout, Order, Payment, Shipping, Return - real DB integration', () => {
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let productRepo: Repository<Product>;
  let variantRepo: Repository<ProductVariant>;
  let cartRepo: Repository<Cart>;
  let cartItemRepo: Repository<CartItem>;
  let orderRepo: Repository<Order>;
  let orderItemRepo: Repository<OrderItem>;
  let discountRepo: Repository<DiscountCode>;
  let shipmentRepo: Repository<ShipmentOrder>;
  let historyRepo: Repository<ShipmentHistory>;
  let exchangeRepo: Repository<ExchangeRequest>;

  let redisMock: RedisMock;
  let vnpayService: { createPaymentUrl: jest.Mock };
  let ghnService: {
    getOrderInfo: jest.Mock;
    createShippingOrderExchange: jest.Mock;
  };
  let mailerService: { sendMail: jest.Mock };

  let cartService: UserCartService;
  let orderService: UserOrderService;
  let adminOrderService: AdminOrderService;
  let shipmentSyncService: ShipmentSyncService;
  let userExchangeService: UserExchangeRequestService;
  let adminExchangeService: AdminExchangeRequestService;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'mysql',
      host: config.DB.HOST,
      port: config.DB.PORT,
      username: config.DB.USER,
      password: config.DB.PASSWORD,
      database: config.DB.NAME,
      synchronize: false,
      entities: [
        ActivityLog,
        AiRecommendationVector,
        AiVector,
        Cart,
        CartItem,
        Category,
        DiscountCode,
        ExchangeRequest,
        Notification,
        Order,
        OrderItem,
        PolicyDocument,
        Product,
        ProductColor,
        ProductImage,
        ProductReview,
        ProductSize,
        ProductVariant,
        ShipmentHistory,
        ShipmentOrder,
        User,
      ],
    });

    await dataSource.initialize();
  });

  beforeEach(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    userRepo = queryRunner.manager.getRepository(User);
    categoryRepo = queryRunner.manager.getRepository(Category);
    productRepo = queryRunner.manager.getRepository(Product);
    variantRepo = queryRunner.manager.getRepository(ProductVariant);
    cartRepo = queryRunner.manager.getRepository(Cart);
    cartItemRepo = queryRunner.manager.getRepository(CartItem);
    orderRepo = queryRunner.manager.getRepository(Order);
    orderItemRepo = queryRunner.manager.getRepository(OrderItem);
    discountRepo = queryRunner.manager.getRepository(DiscountCode);
    shipmentRepo = queryRunner.manager.getRepository(ShipmentOrder);
    historyRepo = queryRunner.manager.getRepository(ShipmentHistory);
    exchangeRepo = queryRunner.manager.getRepository(ExchangeRequest);

    redisMock = buildRedisMock();
    vnpayService = {
      createPaymentUrl: jest.fn(
        async ({ orderId }) => `https://vnpay.test/pay/${orderId}`,
      ),
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
      vnpayService as any,
      redisMock as any,
      shipmentRepo,
    );
    adminOrderService = new AdminOrderService(orderRepo);
    shipmentSyncService = new ShipmentSyncService(
      shipmentRepo,
      historyRepo,
      orderRepo,
      ghnService as any,
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
      ghnService as any,
      shipmentRepo,
      variantRepo,
      mailerService as any,
      productRepo,
      orderService,
    );
  });

  afterEach(async () => {
    // Rollback: every row inserted/updated in the real MySQL database is reverted.
    if (queryRunner?.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    if (queryRunner && !queryRunner.isReleased) {
      await queryRunner.release();
    }
    jest.restoreAllMocks();

    // CheckDB after rollback: marker users created by the test must not remain.
    for (const email of trackedEmails.splice(0)) {
      const leakedUser = await dataSource
        .getRepository(User)
        .findOne({ where: { email } });
      expect(leakedUser).toBeNull();
    }
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  const createUser = async () => {
    const key = nextKey('user');
    const email = `${key}@realdb.test`;
    trackedEmails.push(email);

    return userRepo.save(
      userRepo.create({
        name: key,
        email,
        passwordHash: 'hashed-password',
        phone: `09${String(uniqueCounter).padStart(8, '0')}`,
        address: 'Ha Noi',
        role: Role.USER,
        isVerified: true,
      }),
    );
  };

  const createProductVariant = async (stock = 20, price = 100000) => {
    const category = await categoryRepo.save(
      categoryRepo.create({
        name: nextKey('category'),
        description: 'Integration category',
      }),
    );
    const product = await productRepo.save(
      productRepo.create({
        name: nextKey('product'),
        description: 'Integration product',
        category,
        categoryId: category.id,
        price,
        discount: 0,
        stock,
        mainImageUrl: 'https://example.test/product.png',
      }),
    );
    const variant = await variantRepo.save(
      variantRepo.create({
        product,
        productId: product.id,
        sku: nextKey('sku'),
        price,
        stock,
        imageUrl: 'https://example.test/variant.png',
      }),
    );

    return { category, product, variant };
  };

  const createCartWithItem = async (
    user: User,
    variant: ProductVariant,
    quantity = 2,
  ) => {
    const cart = await cartRepo.save(
      cartRepo.create({
        user,
        totalPrice: Number(variant.price) * quantity,
      }),
    );
    const item = await cartItemRepo.save(
      cartItemRepo.create({
        cart,
        variant,
        quantity,
        price: variant.price,
      }),
    );

    return { cart, item };
  };

  const createOrderWithItem = async (
    user: User,
    variant: ProductVariant,
    overrides: Partial<Order> = {},
  ) => {
    const order = await orderRepo.save(
      orderRepo.create({
        user,
        totalAmount: Number(variant.price),
        orderStatus: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.UNPAID,
        shipmentStatus: ShipmentStatus.READY_TO_PICK,
        shippingAddress: 'Ha Noi',
        vnpTransDate: '20250112121212',
        vnpTxnRef: nextKey('txn'),
        ...overrides,
      }),
    );
    const orderItem = await orderItemRepo.save(
      orderItemRepo.create({
        order,
        orderId: order.id,
        variant,
        variantId: variant.id,
        quantity: 1,
        price: variant.price,
      }),
    );

    return { order, orderItem };
  };

  const mockGhnOrderInfo = (
    status: ShipmentStatus = ShipmentStatus.DELIVERED,
  ) => {
    ghnService.getOrderInfo.mockResolvedValue({
      data: {
        log: [{ status, updated_date: '2025-01-10T10:00:00.000Z' }],
        return_name: 'SHOP',
        return_phone: '0900000000',
        return_address: 'Shop address',
        return_ward_code: '001',
        return_district_id: 1,
        to_name: 'Customer',
        to_phone: '0911111111',
        to_address: 'Customer address',
        to_ward_code: '002',
        to_district_id: 2,
        items: [
          {
            name: 'Product',
            quantity: 1,
            price: 100000,
            weight: 500,
            length: 10,
            width: 10,
            height: 5,
          },
        ],
        weight: 500,
        length: 10,
        width: 10,
        height: 5,
      },
    });
  };

  // Test Case ID: TC_REALDB_CART_001
  it('[TC_REALDB_CART_001] creates a cart in real DB when the user has no cart', async () => {
    const user = await createUser();

    const result = await cartService.getUserCart(user.id);

    expect(result).toBeTruthy();

    // CheckDB: verify the cart row is present before transaction rollback.
    const dbCart = await cartRepo.findOne({
      where: { id: result.id },
      relations: ['user'],
    });
    expect(dbCart?.user.id).toBe(user.id);
  });

  // Test Case ID: TC_REALDB_CART_002
  it('[TC_REALDB_CART_002] adds a new cart item and recalculates total price in real DB', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 125000);

    const result = await cartService.addItem(user.id, {
      variantId: variant.id,
      quantity: 2,
    });

    expect(result.items).toHaveLength(1);
    expect(Number(result.totalPrice)).toBe(250000);

    // CheckDB: cart_items row must point to the saved cart and variant.
    const dbItem = await cartItemRepo.findOne({
      where: { variant: { id: variant.id } },
      relations: ['cart', 'variant'],
    });
    expect(dbItem?.cart.id).toBe(result.id);
    expect(dbItem?.quantity).toBe(2);
  });

  // Test Case ID: TC_REALDB_CART_003
  it('[TC_REALDB_CART_003] updates item quantity and persists the new cart total', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 90000);
    const { item } = await createCartWithItem(user, variant, 1);

    const result = await cartService.updateItem(item.id, { quantity: 3 });

    expect(result.items[0].quantity).toBe(3);
    expect(Number(result.totalPrice)).toBe(270000);

    // CheckDB: the item quantity and cart total were updated in MySQL.
    const dbItem = await cartItemRepo.findOne({ where: { id: item.id } });
    const dbCart = await cartRepo.findOne({ where: { id: result.id } });
    expect(dbItem?.quantity).toBe(3);
    expect(Number(dbCart?.totalPrice)).toBe(270000);
  });

  // Test Case ID: TC_REALDB_CART_004
  it('[TC_REALDB_CART_004] clears all cart items and resets total price', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 70000);
    const { cart } = await createCartWithItem(user, variant, 2);

    const result = await cartService.clearCart(user.id);

    expect(result.message).toBe('Đã xóa toàn bộ giỏ hàng');

    // CheckDB: cart remains, items are deleted, total is reset.
    const itemCount = await cartItemRepo.count({
      where: { cart: { id: cart.id } },
    });
    const dbCart = await cartRepo.findOne({ where: { id: cart.id } });
    expect(itemCount).toBe(0);
    expect(Number(dbCart?.totalPrice)).toBe(0);
  });

  // Test Case ID: TC_REALDB_CHECKOUT_001
  it('[TC_REALDB_CHECKOUT_001] checks out from cart with COD and writes order, item, shipment, stock changes', async () => {
    const user = await createUser();
    const { product, variant } = await createProductVariant(10, 150000);
    const { cart } = await createCartWithItem(user, variant, 2);

    const order = (await orderService.fromCart(user.id, {
      paymentMethod: PaymentMethod.COD,
      shippingAddress: 'Ha Noi',
      shippingFee: 20000,
    } as any)) as Order;

    expect(order.paymentStatus).toBe(PaymentStatus.UNPAID);
    expect(Number(order.totalAmount)).toBe(320000);

    // CheckDB: checkout creates order data, removes cart, and deducts stock.
    const dbOrderItems = await orderItemRepo.find({
      where: { orderId: order.id },
    });
    const dbShipment = await shipmentRepo.findOne({
      where: { orderId: order.id },
    });
    const dbCart = await cartRepo.findOne({ where: { id: cart.id } });
    const dbVariant = await variantRepo.findOne({ where: { id: variant.id } });
    const dbProduct = await productRepo.findOne({ where: { id: product.id } });
    expect(dbOrderItems).toHaveLength(1);
    expect(dbShipment?.shipmentStatus).toBe(ShipmentStatus.READY_TO_PICK);
    expect(dbCart).toBeNull();
    expect(dbVariant?.stock).toBe(8);
    expect(dbProduct?.stock).toBe(8);
  });

  // Test Case ID: TC_REALDB_CHECKOUT_002
  it('[TC_REALDB_CHECKOUT_002] applies a discount code during cart checkout', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 200000);
    await createCartWithItem(user, variant, 1);
    const discount = await discountRepo.save(
      discountRepo.create({
        code: nextKey('SALE10'),
        description: '10 percent',
        discountPercent: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2030-12-31'),
        usageLimit: 10,
        usedCount: 0,
      }),
    );

    const order = (await orderService.fromCart(user.id, {
      paymentMethod: PaymentMethod.COD,
      shippingAddress: 'Ha Noi',
      shippingFee: 10000,
      discountCode: discount.code,
    } as any)) as Order;

    expect(Number(order.totalAmount)).toBe(190000);

    // CheckDB: usage counter is incremented atomically in the database.
    const dbDiscount = await discountRepo.findOne({
      where: { id: discount.id },
    });
    expect(dbDiscount?.usedCount).toBe(1);
  });

  // Test Case ID: TC_REALDB_CHECKOUT_003
  it('[TC_REALDB_CHECKOUT_003] buyNow with VNPAY creates pending order and returns payment URL', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 300000);

    const result = (await orderService.buyNow(user.id, {
      variantId: variant.id,
      quantity: 1,
      paymentMethod: PaymentMethod.VNPAY,
      shippingAddress: 'Ha Noi',
      shippingFee: 15000,
    } as any)) as { order: Order; payUrl: string };

    expect(result.payUrl).toContain('https://vnpay.test/pay/');
    expect(result.order.paymentStatus).toBe(PaymentStatus.PENDING);

    // CheckDB: VNPAY order and shipment are persisted, but COD stock deduction is not applied.
    const dbShipment = await shipmentRepo.findOne({
      where: { orderId: result.order.id },
    });
    const dbVariant = await variantRepo.findOne({ where: { id: variant.id } });
    expect(dbShipment).toBeTruthy();
    expect(dbVariant?.stock).toBe(10);
  });

  // Test Case ID: TC_REALDB_ORDER_001
  it('[TC_REALDB_ORDER_001] returns only the selected user order detail', async () => {
    const user = await createUser();
    const otherUser = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { order } = await createOrderWithItem(user, variant);
    const { order: otherOrder } = await createOrderWithItem(otherUser, variant);

    const detail = await orderService.getOrderDetail(user.id, order.id);

    expect(detail.id).toBe(order.id);
    await expect(
      orderService.getOrderDetail(user.id, otherOrder.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Test Case ID: TC_REALDB_ORDER_002
  it('[TC_REALDB_ORDER_002] reports comment availability for delivered orders without reviews', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { order, orderItem } = await createOrderWithItem(user, variant, {
      orderStatus: OrderStatus.COMPLETED,
      shipmentStatus: ShipmentStatus.DELIVERED,
    });

    const result = await orderService.getOrderCommentStatus(user.id, order.id);

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orderItemId: orderItem.id,
          canComment: true,
          reviewed: false,
        }),
      ]),
    );
  });

  // Test Case ID: TC_REALDB_ORDER_003
  it('[TC_REALDB_ORDER_003] admin order listing reads orders from real DB', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { order } = await createOrderWithItem(user, variant);

    const result = await adminOrderService.listAll({
      page: 1,
      limit: 10,
    } as any);

    expect(result.data.some((item) => item.id === order.id)).toBe(true);
  });

  // Test Case ID: TC_REALDB_PAYMENT_001
  it('[TC_REALDB_PAYMENT_001] marks an order as paid and confirmed when VNPay callback succeeds', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { order } = await createOrderWithItem(user, variant, {
      paymentMethod: PaymentMethod.VNPAY,
      paymentStatus: PaymentStatus.PENDING,
    });

    const result = await orderService.handlePaymentCallback(
      order.id,
      '00',
      110000,
    );

    expect(result).toEqual({ RspCode: '00', Message: 'Confirm Success' });

    // CheckDB: payment and order statuses are persisted.
    const dbOrder = await orderRepo.findOne({ where: { id: order.id } });
    expect(dbOrder?.paymentStatus).toBe(PaymentStatus.PAID);
    expect(dbOrder?.orderStatus).toBe(OrderStatus.CONFIRMED);
  });

  // Test Case ID: TC_REALDB_PAYMENT_002
  it('[TC_REALDB_PAYMENT_002] cancels an order when VNPay callback fails', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { order } = await createOrderWithItem(user, variant, {
      paymentMethod: PaymentMethod.VNPAY,
      paymentStatus: PaymentStatus.PENDING,
    });

    await orderService.handlePaymentCallback(order.id, '24', 110000);

    // CheckDB: failed payment is reflected in the order row.
    const dbOrder = await orderRepo.findOne({ where: { id: order.id } });
    expect(dbOrder?.paymentStatus).toBe(PaymentStatus.FAILED);
    expect(dbOrder?.orderStatus).toBe(OrderStatus.CANCELLED);
  });

  // Test Case ID: TC_REALDB_PAYMENT_003
  it('[TC_REALDB_PAYMENT_003] refuses to process an already paid order again', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { order } = await createOrderWithItem(user, variant, {
      paymentStatus: PaymentStatus.PAID,
      orderStatus: OrderStatus.CONFIRMED,
    });

    const result = await orderService.handlePaymentCallback(
      order.id,
      '00',
      110000,
    );

    expect(result).toEqual({ RspCode: '02', Message: 'Order already paid' });
  });

  // Test Case ID: TC_REALDB_SHIPPING_001
  it('[TC_REALDB_SHIPPING_001] syncs delivered shipment and marks order completed/paid', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { order } = await createOrderWithItem(user, variant);
    const shipment = await shipmentRepo.save(
      shipmentRepo.create({
        orderId: order.id,
        ghnOrderCode: nextKey('GHN'),
        shipmentStatus: ShipmentStatus.READY_TO_PICK,
        type: 'order',
      }),
    );
    mockGhnOrderInfo(ShipmentStatus.DELIVERED);

    await shipmentSyncService.syncShipment(shipment);

    // CheckDB: shipment history and order statuses are written to MySQL.
    const history = await historyRepo.findOne({
      where: { shipmentOrderId: shipment.id },
    });
    const dbOrder = await orderRepo.findOne({ where: { id: order.id } });
    expect(history?.shipmentStatus).toBe(ShipmentStatus.DELIVERED);
    expect(dbOrder?.orderStatus).toBe(OrderStatus.COMPLETED);
    expect(dbOrder?.paymentStatus).toBe(PaymentStatus.PAID);
  });

  // Test Case ID: TC_REALDB_SHIPPING_002
  it('[TC_REALDB_SHIPPING_002] syncs returned shipment and restores variant/product stock', async () => {
    const user = await createUser();
    const { product, variant } = await createProductVariant(5, 110000);
    const { order } = await createOrderWithItem(user, variant);
    await shipmentRepo.save(
      shipmentRepo.create({
        orderId: order.id,
        ghnOrderCode: nextKey('GHN'),
        shipmentStatus: ShipmentStatus.READY_TO_PICK,
        type: 'order',
      }),
    );
    const shipment = await shipmentRepo.findOneOrFail({
      where: { orderId: order.id },
    });
    mockGhnOrderInfo(ShipmentStatus.RETURNED);

    await shipmentSyncService.syncShipment(shipment);

    // CheckDB: stock is restored and order is refunded/cancelled.
    const dbVariant = await variantRepo.findOne({ where: { id: variant.id } });
    const dbProduct = await productRepo.findOne({ where: { id: product.id } });
    const dbOrder = await orderRepo.findOne({ where: { id: order.id } });
    expect(dbVariant?.stock).toBe(6);
    expect(dbProduct?.stock).toBe(6);
    expect(dbOrder?.paymentStatus).toBe(PaymentStatus.REFUNDED);
    expect(dbOrder?.orderStatus).toBe(OrderStatus.CANCELLED);
  });

  // Test Case ID: TC_REALDB_SHIPPING_003
  it('[TC_REALDB_SHIPPING_003] does not duplicate shipment history for the same GHN status', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { order } = await createOrderWithItem(user, variant);
    const shipment = await shipmentRepo.save(
      shipmentRepo.create({
        orderId: order.id,
        ghnOrderCode: nextKey('GHN'),
        shipmentStatus: ShipmentStatus.READY_TO_PICK,
        type: 'order',
      }),
    );
    mockGhnOrderInfo(ShipmentStatus.DELIVERED);

    await shipmentSyncService.syncShipment(shipment);
    await shipmentSyncService.syncShipment(shipment);

    // CheckDB: only one history row exists for the delivered status.
    const count = await historyRepo.count({
      where: {
        shipmentOrderId: shipment.id,
        ghnStatus: ShipmentStatus.DELIVERED,
      },
    });
    expect(count).toBe(1);
  });

  // Test Case ID: TC_REALDB_RETURN_001
  it('[TC_REALDB_RETURN_001] creates a pending return request for a valid order item', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { orderItem } = await createOrderWithItem(user, variant, {
      orderStatus: OrderStatus.COMPLETED,
    });

    const request = await userExchangeService.createReturn(
      { orderItemId: orderItem.id, reason: 'Wrong size', images: ['img.png'] },
      user.id,
    );

    expect(request.status).toBe(ExchangeStatus.PENDING);

    // CheckDB: exchange request row is persisted.
    const dbRequest = await exchangeRepo.findOne({ where: { id: request.id } });
    expect(dbRequest?.userId).toBe(user.id);
    expect(dbRequest?.orderItemId).toBe(orderItem.id);
  });

  // Test Case ID: TC_REALDB_RETURN_002
  it('[TC_REALDB_RETURN_002] blocks duplicate return requests for the same order item', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { orderItem } = await createOrderWithItem(user, variant);
    await userExchangeService.createReturn(
      { orderItemId: orderItem.id, reason: 'Wrong size', images: [] },
      user.id,
    );

    await expect(
      userExchangeService.createReturn(
        { orderItemId: orderItem.id, reason: 'Wrong size again', images: [] },
        user.id,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // Test Case ID: TC_REALDB_RETURN_003
  it('[TC_REALDB_RETURN_003] approves a return and creates an exchange pickup shipment', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { order, orderItem } = await createOrderWithItem(user, variant);
    await shipmentRepo.save(
      shipmentRepo.create({
        orderId: order.id,
        ghnOrderCode: nextKey('GHN'),
        shipmentStatus: ShipmentStatus.DELIVERED,
        type: 'order',
      }),
    );
    const request = await userExchangeService.createReturn(
      { orderItemId: orderItem.id, reason: 'Wrong size', images: [] },
      user.id,
    );
    mockGhnOrderInfo();
    ghnService.createShippingOrderExchange.mockResolvedValue({
      data: { order_code: nextKey('GHN_PICKUP') },
    });

    const approved = await adminExchangeService.approveReturn(request.id);

    expect(approved.status).toBe(ExchangeStatus.APPROVED);

    // CheckDB: pickup shipment is saved and linked to the exchange request.
    const pickup = await shipmentRepo.findOne({
      where: { exchangeRequestId: request.id, type: 'exchange_pickup' },
    });
    expect(pickup?.shipmentStatus).toBe(ShipmentStatus.READY_TO_PICK);
  });

  // Test Case ID: TC_REALDB_RETURN_004
  it('[TC_REALDB_RETURN_004] rejects a return request and stores the reject reason', async () => {
    const user = await createUser();
    const { variant } = await createProductVariant(10, 110000);
    const { orderItem } = await createOrderWithItem(user, variant);
    const request = await userExchangeService.createReturn(
      { orderItemId: orderItem.id, reason: 'Wrong size', images: [] },
      user.id,
    );

    await adminExchangeService.rejectReturn(request.id, {
      reason: 'Policy not matched',
    });

    // CheckDB: reject status and reason are persisted.
    const dbRequest = await exchangeRepo.findOne({ where: { id: request.id } });
    expect(dbRequest?.status).toBe(ExchangeStatus.REJECTED);
    expect(dbRequest?.rejectReason).toBe('Policy not matched');
  });
});
