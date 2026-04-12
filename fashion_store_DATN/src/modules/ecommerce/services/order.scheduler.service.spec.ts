import { OrderScheduler } from './order.scheduler.service';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@modules/ecommerce/entities/order.entity';

describe('OrderScheduler', () => {
  let service: OrderScheduler;

  let orderRepo: any;
  let orderItemRepo: any;
  let variantRepo: any;
  let productRepo: any;
  let vnpayService: any;

  beforeEach(() => {
    orderRepo = {
      find: jest.fn(),
      save: jest.fn(),
    };

    orderItemRepo = {
      find: jest.fn(),
    };

    variantRepo = {
      decrement: jest.fn(),
      findOne: jest.fn(),
    };

    productRepo = {
      decrement: jest.fn(),
    };

    vnpayService = {
      checkTransaction: jest.fn(),
    };

    service = new OrderScheduler(
      orderRepo,
      orderItemRepo,
      variantRepo,
      productRepo,
      vnpayService,
    );
  });

  it('TC-PAYMENT-SCHED-001 should do nothing when no pending VNPay orders', async () => {
    orderRepo.find.mockResolvedValue([]);

    await service.checkPendingVnPayOrders();

    expect(vnpayService.checkTransaction).not.toHaveBeenCalled();
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('TC-PAYMENT-SCHED-002 should mark order PAID and CONFIRMED when transaction succeeds', async () => {
    const order = {
      id: 1,
      paymentMethod: PaymentMethod.VNPAY,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
    } as any;

    orderRepo.find.mockResolvedValue([order]);
    vnpayService.checkTransaction.mockResolvedValue({
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
    });
    orderItemRepo.find.mockResolvedValue([]);

    await service.checkPendingVnPayOrders();

    expect(order.paymentStatus).toBe(PaymentStatus.PAID);
    expect(order.orderStatus).toBe(OrderStatus.CONFIRMED);
    expect(orderRepo.save).toHaveBeenCalledWith(order);
  });

  it('TC-PAYMENT-SCHED-003 should decrement variant and product stock on successful payment', async () => {
    const order = { id: 2, paymentStatus: PaymentStatus.PENDING } as any;

    orderRepo.find.mockResolvedValue([order]);
    vnpayService.checkTransaction.mockResolvedValue({
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
    });
    orderItemRepo.find.mockResolvedValue([
      { variantId: 11, quantity: 2 },
      { variantId: 12, quantity: 1 },
    ]);
    variantRepo.findOne.mockResolvedValueOnce({ productId: 101 }).mockResolvedValueOnce({
      productId: 102,
    });

    await service.checkPendingVnPayOrders();

    expect(variantRepo.decrement).toHaveBeenCalledTimes(2);
    expect(productRepo.decrement).toHaveBeenCalledTimes(2);
  });

  it('TC-PAYMENT-SCHED-004 should skip product decrement if variant lookup is missing', async () => {
    const order = { id: 3, paymentStatus: PaymentStatus.PENDING } as any;

    orderRepo.find.mockResolvedValue([order]);
    vnpayService.checkTransaction.mockResolvedValue({
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
    });
    orderItemRepo.find.mockResolvedValue([{ variantId: 11, quantity: 2 }]);
    variantRepo.findOne.mockResolvedValue(null);

    await service.checkPendingVnPayOrders();

    expect(variantRepo.decrement).toHaveBeenCalledWith({ id: 11 }, 'stock', 2);
    expect(productRepo.decrement).not.toHaveBeenCalled();
  });

  it('TC-PAYMENT-SCHED-005 should keep order pending and increase check count if below retry limit', async () => {
    const order = {
      id: 4,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
      vnpayCheckCount: 1,
    } as any;

    orderRepo.find.mockResolvedValue([order]);
    vnpayService.checkTransaction.mockResolvedValue({
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '01',
    });

    await service.checkPendingVnPayOrders();

    expect(order.vnpayCheckCount).toBe(2);
    expect(order.paymentStatus).toBe(PaymentStatus.PENDING);
    expect(order.orderStatus).toBe(OrderStatus.PENDING);
    expect(orderRepo.save).toHaveBeenCalledWith(order);
  });

  it('TC-PAYMENT-SCHED-006 should cancel order when pending retry count reaches threshold', async () => {
    const order = {
      id: 5,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
      vnpayCheckCount: 2,
    } as any;

    orderRepo.find.mockResolvedValue([order]);
    vnpayService.checkTransaction.mockResolvedValue({
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '01',
    });

    await service.checkPendingVnPayOrders();

    expect(order.paymentStatus).toBe(PaymentStatus.FAILED);
    expect(order.orderStatus).toBe(OrderStatus.CANCELLED);
    expect(orderRepo.save).toHaveBeenCalledWith(order);
  });

  it('TC-PAYMENT-SCHED-007 should cancel order for unrecoverable failure response code', async () => {
    const order = {
      id: 6,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
    } as any;

    orderRepo.find.mockResolvedValue([order]);
    vnpayService.checkTransaction.mockResolvedValue({
      vnp_ResponseCode: '24',
      vnp_TransactionStatus: '99',
    });

    await service.checkPendingVnPayOrders();

    expect(order.paymentStatus).toBe(PaymentStatus.FAILED);
    expect(order.orderStatus).toBe(OrderStatus.CANCELLED);
  });

  it('TC-PAYMENT-SCHED-008 should treat response code 91 as pending and increase retry count', async () => {
    const order = {
      id: 7,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
      vnpayCheckCount: 0,
    } as any;

    orderRepo.find.mockResolvedValue([order]);
    vnpayService.checkTransaction.mockResolvedValue({
      vnp_ResponseCode: '91',
      vnp_TransactionStatus: '99',
    });

    await service.checkPendingVnPayOrders();

    expect(order.vnpayCheckCount).toBe(1);
    expect(orderRepo.save).toHaveBeenCalledWith(order);
  });

  it('TC-PAYMENT-SCHED-009 should handle checkTransaction errors without crashing loop', async () => {
    const order = {
      id: 8,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
    } as any;

    orderRepo.find.mockResolvedValue([order]);
    vnpayService.checkTransaction.mockRejectedValue(new Error('network timeout'));

    await service.checkPendingVnPayOrders();

    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('TC-PAYMENT-SCHED-010 should continue processing next orders after one check error', async () => {
    const order1 = { id: 9, paymentStatus: PaymentStatus.PENDING } as any;
    const order2 = { id: 10, paymentStatus: PaymentStatus.PENDING } as any;

    orderRepo.find.mockResolvedValue([order1, order2]);
    vnpayService.checkTransaction
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce({ vnp_ResponseCode: '00', vnp_TransactionStatus: '00' });
    orderItemRepo.find.mockResolvedValue([]);

    await service.checkPendingVnPayOrders();

    expect(orderRepo.save).toHaveBeenCalledTimes(1);
    expect(orderRepo.save).toHaveBeenCalledWith(order2);
  });

  it('TC-PAYMENT-SCHED-011 should query only pending VNPay orders', async () => {
    orderRepo.find.mockResolvedValue([]);

    await service.checkPendingVnPayOrders();

    expect(orderRepo.find).toHaveBeenCalledWith({
      where: {
        paymentMethod: PaymentMethod.VNPAY,
        paymentStatus: PaymentStatus.PENDING,
      },
    });
  });

  it('TC-PAYMENT-SCHED-012 should increase retry count by exactly one on pending result', async () => {
    const order = {
      id: 11,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
      vnpayCheckCount: 0,
    } as any;

    orderRepo.find.mockResolvedValue([order]);
    vnpayService.checkTransaction.mockResolvedValue({
      vnp_ResponseCode: '75',
      vnp_TransactionStatus: '99',
    });

    await service.checkPendingVnPayOrders();

    expect(order.vnpayCheckCount).toBe(1);
  });
});
