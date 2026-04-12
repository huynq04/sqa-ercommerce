import { ShipmentSyncService } from './shipment-sync.service';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';
import { OrderStatus, PaymentStatus } from '@modules/ecommerce/entities/order.entity';

describe('ShipmentSyncService', () => {
  let service: ShipmentSyncService;

  let shipmentRepo: any;
  let historyRepo: any;
  let orderRepo: any;
  let ghnService: any;
  let orderItemRepo: any;
  let variantRepo: any;
  let productRepo: any;

  beforeEach(() => {
    shipmentRepo = {
      save: jest.fn(),
    };

    historyRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    orderRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    ghnService = {
      getOrderInfo: jest.fn(),
    };

    orderItemRepo = {
      find: jest.fn(),
    };

    variantRepo = {
      increment: jest.fn(),
      findOne: jest.fn(),
    };

    productRepo = {
      increment: jest.fn(),
    };

    service = new ShipmentSyncService(
      shipmentRepo,
      historyRepo,
      orderRepo,
      ghnService,
      orderItemRepo,
      variantRepo,
      productRepo,
    );
  });

  it('TC-SHIPPING-SVC-001 should ignore placeholder shipment code ABC', async () => {
    await service.syncShipment({ id: 1, ghnOrderCode: 'ABC' } as any);

    expect(ghnService.getOrderInfo).not.toHaveBeenCalled();
    expect(historyRepo.save).not.toHaveBeenCalled();
  });

  it('TC-SHIPPING-SVC-002 should return when GHN logs are empty', async () => {
    ghnService.getOrderInfo.mockResolvedValue({ data: { log: [] } });

    await service.syncShipment({ id: 2, ghnOrderCode: 'G2' } as any);

    expect(historyRepo.findOne).not.toHaveBeenCalled();
  });

  it('TC-SHIPPING-SVC-003 should skip log when history already exists', async () => {
    ghnService.getOrderInfo.mockResolvedValue({
      data: { log: [{ status: ShipmentStatus.PICKING, updated_date: '2026-01-01T00:00:00Z' }] },
    });
    historyRepo.findOne.mockResolvedValue({ id: 1 });

    await service.syncShipment({ id: 3, ghnOrderCode: 'G3' } as any);

    expect(historyRepo.save).not.toHaveBeenCalled();
  });

  it('TC-SHIPPING-SVC-004 should save new history and update shipment status', async () => {
    const shipment = {
      id: 4,
      orderId: 100,
      type: 'order',
      ghnOrderCode: 'G4',
      shipmentStatus: ShipmentStatus.READY_TO_PICK,
    } as any;

    ghnService.getOrderInfo.mockResolvedValue({
      data: {
        log: [{ status: ShipmentStatus.DELIVERING, updated_date: '2026-01-01T00:00:00Z' }],
      },
    });
    historyRepo.findOne.mockResolvedValue(null);
    const businessSpy = jest
      .spyOn(service, 'applyOrderBusiness')
      .mockResolvedValue(undefined);

    await service.syncShipment(shipment);

    expect(historyRepo.save).toHaveBeenCalled();
    expect(shipmentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ shipmentStatus: ShipmentStatus.DELIVERING }),
    );
    expect(businessSpy).toHaveBeenCalledWith(
      expect.objectContaining({ shipmentStatus: ShipmentStatus.DELIVERING }),
    );
  });

  it('TC-SHIPPING-SVC-005 should apply business rule only for new logs', async () => {
    const shipment = {
      id: 5,
      orderId: 1,
      type: 'order',
      ghnOrderCode: 'G5',
      shipmentStatus: ShipmentStatus.READY_TO_PICK,
    } as any;

    ghnService.getOrderInfo.mockResolvedValue({
      data: {
        log: [
          { status: ShipmentStatus.PICKING, updated_date: '2026-01-01T00:00:00Z' },
          { status: ShipmentStatus.SORTING, updated_date: '2026-01-01T01:00:00Z' },
        ],
      },
    });
    historyRepo.findOne.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null);
    const businessSpy = jest
      .spyOn(service, 'applyOrderBusiness')
      .mockResolvedValue(undefined);

    await service.syncShipment(shipment);

    expect(historyRepo.save).toHaveBeenCalledTimes(1);
    expect(businessSpy).toHaveBeenCalledTimes(1);
  });

  it('TC-SHIPPING-SVC-006 should skip business processing when shipment type is not order', async () => {
    await service.applyOrderBusiness({ type: 'exchange_pickup' } as any);

    expect(orderRepo.findOne).not.toHaveBeenCalled();
  });

  it('TC-SHIPPING-SVC-007 should return when order is missing in business processing', async () => {
    orderRepo.findOne.mockResolvedValue(null);

    await service.applyOrderBusiness({ type: 'order', orderId: 999 } as any);

    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('TC-SHIPPING-SVC-008 should mark order completed and paid when delivered', async () => {
    const order = { id: 7 } as any;
    orderRepo.findOne.mockResolvedValue(order);

    await service.applyOrderBusiness({
      type: 'order',
      orderId: 7,
      shipmentStatus: ShipmentStatus.DELIVERED,
    } as any);

    expect(order.orderStatus).toBe(OrderStatus.COMPLETED);
    expect(order.paymentStatus).toBe(PaymentStatus.PAID);
    expect(order.shipmentStatus).toBe(ShipmentStatus.DELIVERED);
    expect(orderRepo.save).toHaveBeenCalledWith(order);
  });

  it('TC-SHIPPING-SVC-009 should restock inventory and refund when returned', async () => {
    const order = { id: 8 } as any;
    orderRepo.findOne.mockResolvedValue(order);
    orderItemRepo.find.mockResolvedValue([
      { variantId: 1, quantity: 2 },
      { variantId: 2, quantity: 1 },
    ]);
    variantRepo.findOne.mockResolvedValueOnce({ productId: 10 }).mockResolvedValueOnce({
      productId: 20,
    });

    await service.applyOrderBusiness({
      type: 'order',
      orderId: 8,
      shipmentStatus: ShipmentStatus.RETURNED,
    } as any);

    expect(variantRepo.increment).toHaveBeenCalledTimes(2);
    expect(productRepo.increment).toHaveBeenCalledTimes(2);
    expect(order.orderStatus).toBe(OrderStatus.CANCELLED);
    expect(order.paymentStatus).toBe(PaymentStatus.REFUNDED);
  });

  it('TC-SHIPPING-SVC-010 should skip product restock when variant is missing', async () => {
    const order = { id: 8 } as any;
    orderRepo.findOne.mockResolvedValue(order);
    orderItemRepo.find.mockResolvedValue([{ variantId: 1, quantity: 2 }]);
    variantRepo.findOne.mockResolvedValue(null);

    await service.applyOrderBusiness({
      type: 'order',
      orderId: 8,
      shipmentStatus: ShipmentStatus.RETURNED,
    } as any);

    expect(variantRepo.increment).toHaveBeenCalledTimes(1);
    expect(productRepo.increment).not.toHaveBeenCalled();
  });

  it('TC-SHIPPING-SVC-011 should restock and refund when shipment is cancelled', async () => {
    const order = { id: 9 } as any;
    orderRepo.findOne.mockResolvedValue(order);
    orderItemRepo.find.mockResolvedValue([{ variantId: 4, quantity: 3 }]);
    variantRepo.findOne.mockResolvedValue({ productId: 12 });

    await service.applyOrderBusiness({
      type: 'order',
      orderId: 9,
      shipmentStatus: ShipmentStatus.CANCEL,
    } as any);

    expect(variantRepo.increment).toHaveBeenCalledWith({ id: 4 }, 'stock', 3);
    expect(productRepo.increment).toHaveBeenCalledWith({ id: 12 }, 'stock', 3);
    expect(order.orderStatus).toBe(OrderStatus.CANCELLED);
    expect(order.paymentStatus).toBe(PaymentStatus.REFUNDED);
  });

  it('TC-SHIPPING-SVC-012 should update shipmentStatus for non-terminal statuses', async () => {
    const order = { id: 10 } as any;
    orderRepo.findOne.mockResolvedValue(order);

    await service.applyOrderBusiness({
      type: 'order',
      orderId: 10,
      shipmentStatus: ShipmentStatus.TRANSPORTING,
    } as any);

    expect(order.shipmentStatus).toBe(ShipmentStatus.TRANSPORTING);
    expect(orderRepo.save).toHaveBeenCalledWith(order);
  });

  it('TC-SHIPPING-SVC-013 should create histories for all new logs in sequence', async () => {
    const shipment = {
      id: 11,
      orderId: 88,
      type: 'order',
      ghnOrderCode: 'G11',
      shipmentStatus: ShipmentStatus.READY_TO_PICK,
    } as any;

    ghnService.getOrderInfo.mockResolvedValue({
      data: {
        log: [
          { status: ShipmentStatus.PICKING, updated_date: '2026-01-01T00:00:00Z' },
          { status: ShipmentStatus.PICKED, updated_date: '2026-01-01T01:00:00Z' },
        ],
      },
    });
    historyRepo.findOne.mockResolvedValue(null);
    jest.spyOn(service, 'applyOrderBusiness').mockResolvedValue(undefined);

    await service.syncShipment(shipment);

    expect(historyRepo.save).toHaveBeenCalledTimes(2);
    expect(shipmentRepo.save).toHaveBeenCalledTimes(2);
  });

  it('TC-SHIPPING-SVC-014 should persist occurredAt as Date object', async () => {
    const shipment = {
      id: 12,
      orderId: 8,
      type: 'order',
      ghnOrderCode: 'G12',
      shipmentStatus: ShipmentStatus.READY_TO_PICK,
    } as any;

    ghnService.getOrderInfo.mockResolvedValue({
      data: {
        log: [{ status: ShipmentStatus.SORTING, updated_date: '2026-01-01T02:00:00Z' }],
      },
    });
    historyRepo.findOne.mockResolvedValue(null);
    jest.spyOn(service, 'applyOrderBusiness').mockResolvedValue(undefined);

    await service.syncShipment(shipment);

    expect(historyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ occurredAt: expect.any(Date) }),
    );
  });

  it('TC-SHIPPING-SVC-015 should save order once per applyOrderBusiness call', async () => {
    const order = { id: 15 } as any;
    orderRepo.findOne.mockResolvedValue(order);

    await service.applyOrderBusiness({
      type: 'order',
      orderId: 15,
      shipmentStatus: ShipmentStatus.DELIVERING,
    } as any);

    expect(orderRepo.save).toHaveBeenCalledTimes(1);
  });

  it('TC-SHIPPING-SVC-016 should call GHN API with shipment order code', async () => {
    ghnService.getOrderInfo.mockResolvedValue({ data: { log: [] } });

    await service.syncShipment({ id: 20, ghnOrderCode: 'GHN_20' } as any);

    expect(ghnService.getOrderInfo).toHaveBeenCalledWith('GHN_20');
  });
});
