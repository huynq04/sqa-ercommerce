import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { config } from '@config';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '@modules/ecommerce/entities/order.entity';
import { Repository } from 'typeorm';
import {
  CreateShippingOrderDto,
  CalculateShippingFeeDto,
  ShippingOrderItemDto,
  UpdateCodDto,
} from './dto/ghn.dto';
import { ShipmentOrder } from '@modules/ecommerce/entities/shipmentOrder.entity';

@Injectable()
export class GhnService {
  private readonly logger = new Logger('GHN');
  private readonly axiosInstance: AxiosInstance;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(ShipmentOrder)
    private readonly shipmentRepo: Repository<ShipmentOrder>,
  ) {
    const ghnConfig = config.GHN;
    if (!ghnConfig?.API_URL || !ghnConfig.TOKEN || !ghnConfig.SHOP_ID) {
      throw new Error(
        'GHN configuration is missing. Please set GHN_API_URL, GHN_TOKEN và GHN_SHOP_ID trong .env',
      );
    }

    this.axiosInstance = axios.create({
      baseURL: ghnConfig.API_URL,
      headers: {
        'Content-Type': 'application/json',
        Token: ghnConfig.TOKEN,
        ShopId: ghnConfig.SHOP_ID,
      },
      timeout: 30000,
    });
  }

  private removeUndefined<T extends Record<string, any>>(obj: T): T {
    const cleaned: Record<string, any> = {};
    Object.keys(obj).forEach((k) => {
      const v = (obj as any)[k];
      if (v !== undefined) cleaned[k] = v;
    });
    return cleaned as T;
  }

  private async getAvailableServiceId(
    fromDistrictId: number,
    toDistrictId: number,
    serviceTypeId?: number | null,
  ): Promise<number | null> {
    try {
      const body = {
        shop_id: Number(config.GHN?.SHOP_ID),
        from_district: fromDistrictId,
        to_district: toDistrictId,
      };

      const res = await this.axiosInstance.post(
        '/shiip/public-api/v2/shipping-order/available-services',
        body,
      );

      if (res.data?.code !== 200) {
        this.logger.error(
          `[GHN] Failed to load available services: ${JSON.stringify(
            res.data,
          )}`,
        );
        return null;
      }

      const services: Array<{
        service_id: number;
        service_type_id: number;
      }> = res.data?.data || [];

      if (!services.length) {
        this.logger.warn(
          `[GHN] No available services for from=${fromDistrictId}, to=${toDistrictId}`,
        );
        return null;
      }

      if (serviceTypeId) {
        const match = services.find(
          (service) => service.service_type_id === serviceTypeId,
        );
        if (match) return match.service_id;
      }

      return services[0].service_id;
    } catch (error: any) {
      this.logger.error(
        `[GHN] Error fetching available services: ${error.message}`,
      );
      if (error.response?.data) {
        this.logger.error(
          `[GHN] Response: ${JSON.stringify(error.response.data)}`,
        );
      }
      return null;
    }
  }

  /**
   * Tạo đơn hàng giao hàng nhanh
   */
  async createShippingOrder(dto: CreateShippingOrderDto) {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException(`Order #${dto.orderId} không tồn tại`);
    }
    const shipmentOrder = await this.shipmentRepo.findOne({
      where: { orderId: order.id },
    });
    console.log(shipmentOrder);
    try {
      const ghnConfig = config.GHN;
      const weight = dto.weight ?? 200;
      const length = dto.length ?? 20;
      const width = dto.width ?? 15;
      const height = dto.height ?? 10;

      const items: ShippingOrderItemDto[] =
        dto.items && dto.items.length > 0
          ? dto.items.map((item) => {
              const category = item.category || undefined;
              const hasCategory =
                !!category &&
                (category.level1 || category.level2 || category.level3);
              return {
                name: item.name,
                code: item.code,
                quantity: item.quantity,
                price: item.price,
                length: item.length,
                width: item.width,
                height: item.height,
                weight: item.weight,
                ...(hasCategory ? { category } : {}),
              } as ShippingOrderItemDto;
            })
          : [
              {
                name: `Đơn hàng #${dto.orderId}`,
                code: `ORDER_${dto.orderId}`,
                quantity: 1,
                price: Number(order.totalAmount || 0),
                weight,
                length,
                width,
                height,
              },
            ];

      const resolvedServiceTypeId = dto.serviceTypeId ?? 2;
      const fromDistrictId = ghnConfig?.FROM_DISTRICT_ID;
      const resolvedServiceId =
        dto.serviceId && dto.serviceId > 0
          ? dto.serviceId
          : await this.getAvailableServiceId(
              fromDistrictId,
              dto.toDistrictId,
              resolvedServiceTypeId,
            );

      if (!resolvedServiceId) {
        throw new Error('Không tìm thấy dịch vụ GHN phù hợp');
      }

      const payload: Record<string, any> = {
        payment_type_id: dto.codAmount && dto.codAmount > 0 ? 2 : 1,
        note: dto.note ?? `Đơn hàng #${dto.orderId}`,
        required_note: 'KHONGCHOXEMHANG',
        from_name: ghnConfig?.FROM_NAME || 'Fashion Store',
        from_phone: ghnConfig?.FROM_PHONE || '',
        from_address: ghnConfig?.FROM_ADDRESS || '',
        from_ward_name: ghnConfig?.FROM_WARD_NAME || '',
        from_district_name: ghnConfig?.FROM_DISTRICT_NAME || '',
        from_province_name: ghnConfig?.FROM_PROVINCE_NAME || '',
        to_name: dto.toName,
        to_phone: dto.toPhone,
        to_address: dto.toAddress,
        to_ward_code: dto.toWardCode,
        to_district_id: dto.toDistrictId,
        cod_amount: dto.codAmount ?? 0,
        content: dto.content ?? `Đơn hàng #${dto.orderId}`,
        weight,
        length,
        width,
        height,
        insurance_value: dto.insuranceValue ?? 0,
        service_id: resolvedServiceId,
        service_type_id: resolvedServiceTypeId,
        pick_station_id: dto.pickStationId,
        deliver_station_id: dto.deliverStationId,
        pick_shift:
          dto.pickShift && dto.pickShift.length > 0 ? dto.pickShift : [2],
        items,
      };

      if (dto.clientOrderCode !== undefined) {
        payload.client_order_code = dto.clientOrderCode;
      }

      // Keep return_* even if null/empty to mirror working cURL
      if ('returnPhone' in dto) payload.return_phone = dto.returnPhone as any;
      if ('returnAddress' in dto)
        payload.return_address = dto.returnAddress as any;
      if ('returnDistrictId' in dto)
        payload.return_district_id = dto.returnDistrictId as any; // can be null
      if ('returnWardCode' in dto)
        payload.return_ward_code = dto.returnWardCode as any; // can be ""

      if (dto.coupon !== undefined) payload.coupon = dto.coupon;

      // Clean optional station ids if falsy (GHN rejects 0)
      if (!payload.pick_station_id) delete payload.pick_station_id;
      if (!payload.deliver_station_id) delete payload.deliver_station_id;

      console.log(payload);
      const bodyObj = this.removeUndefined(payload);

      this.logger.debug(
        `[GHN] Creating shipping order for order #${dto.orderId}`,
      );
      this.logger.debug(`[GHN] Body: ${JSON.stringify(bodyObj)}`);
      const response = await this.axiosInstance.post(
        '/shiip/public-api/v2/shipping-order/create',
        bodyObj,
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (response.status >= 400) {
        throw new Error(
          (response.data &&
            (response.data.message || JSON.stringify(response.data))) ||
            `GHN error ${response.status}`,
        );
      }

      if (response.data?.code === 200 && response.data?.data) {
        const orderCode = response.data.data.order_code;
        console.log('ok');
        // Lưu thông tin GHN vào order
        order.ghnOrderCode = orderCode;
        await this.orderRepo.save(order);
        shipmentOrder.ghnOrderCode = orderCode;
        await this.shipmentRepo.save(shipmentOrder);

        this.logger.log(
          `[GHN] Created shipping order: ${orderCode} for order #${dto.orderId}`,
        );
        return {
          success: true,
          orderCode,
          data: response.data.data,
        };
      } else {
        this.logger.error(
          `[GHN] Failed to create shipping order: ${JSON.stringify(response.data)}`,
        );
        throw new Error(response.data?.message || 'Không thể tạo đơn hàng GHN');
      }
    } catch (error: any) {
      this.logger.error(
        `[GHN] Error creating shipping order: ${error.message}`,
      );
      if (error.response?.data) {
        this.logger.error(
          `[GHN] Response: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  async createShippingOrderExchange(dto: CreateShippingOrderDto) {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException(`Order #${dto.orderId} không tồn tại`);
    }
    // const shipmentOrder = await this.shipmentRepo.findOne({
    //   where: { orderId: order.id },
    // });
    // console.log(shipmentOrder);
    try {
      const ghnConfig = config.GHN;
      const weight = dto.weight ?? 200;
      const length = dto.length ?? 20;
      const width = dto.width ?? 15;
      const height = dto.height ?? 10;

      const items: ShippingOrderItemDto[] =
        dto.items && dto.items.length > 0
          ? dto.items.map((item) => {
              const category = item.category || undefined;
              const hasCategory =
                !!category &&
                (category.level1 || category.level2 || category.level3);
              return {
                name: item.name,
                code: item.code,
                quantity: item.quantity,
                price: item.price,
                length: item.length,
                width: item.width,
                height: item.height,
                weight: item.weight,
                ...(hasCategory ? { category } : {}),
              } as ShippingOrderItemDto;
            })
          : [
              {
                name: `Đơn hàng #${dto.orderId}`,
                code: `ORDER_${dto.orderId}`,
                quantity: 1,
                price: Number(order.totalAmount || 0),
                weight,
                length,
                width,
                height,
              },
            ];

      const resolvedServiceTypeId = dto.serviceTypeId ?? 2;
      const fromDistrictId = ghnConfig?.FROM_DISTRICT_ID;
      const resolvedServiceId =
        dto.serviceId && dto.serviceId > 0
          ? dto.serviceId
          : await this.getAvailableServiceId(
              fromDistrictId,
              dto.toDistrictId,
              resolvedServiceTypeId,
            );

      if (!resolvedServiceId) {
        throw new Error('Không tìm thấy dịch vụ GHN phù hợp');
      }

      const payload: Record<string, any> = {
        payment_type_id: dto.codAmount && dto.codAmount > 0 ? 2 : 1,
        note: dto.note ?? `Đơn hàng #${dto.orderId}`,
        required_note: 'KHONGCHOXEMHANG',
        from_name: ghnConfig?.FROM_NAME || 'Fashion Store',
        from_phone: ghnConfig?.FROM_PHONE || '',
        from_address: ghnConfig?.FROM_ADDRESS || '',
        from_ward_name: ghnConfig?.FROM_WARD_NAME || '',
        from_district_name: ghnConfig?.FROM_DISTRICT_NAME || '',
        from_province_name: ghnConfig?.FROM_PROVINCE_NAME || '',
        to_name: dto.toName,
        to_phone: dto.toPhone,
        to_address: dto.toAddress,
        to_ward_code: dto.toWardCode,
        to_district_id: dto.toDistrictId,
        cod_amount: dto.codAmount ?? 0,
        content: dto.content ?? `Đơn hàng #${dto.orderId}`,
        weight,
        length,
        width,
        height,
        insurance_value: dto.insuranceValue ?? 0,
        service_id: resolvedServiceId,
        service_type_id: resolvedServiceTypeId,
        pick_station_id: dto.pickStationId,
        deliver_station_id: dto.deliverStationId,
        pick_shift:
          dto.pickShift && dto.pickShift.length > 0 ? dto.pickShift : [2],
        items,
      };

      if (dto.clientOrderCode !== undefined) {
        payload.client_order_code = dto.clientOrderCode;
      }

      // Keep return_* even if null/empty to mirror working cURL
      if ('returnPhone' in dto) payload.return_phone = dto.returnPhone as any;
      if ('returnAddress' in dto)
        payload.return_address = dto.returnAddress as any;
      if ('returnDistrictId' in dto)
        payload.return_district_id = dto.returnDistrictId as any; // can be null
      if ('returnWardCode' in dto)
        payload.return_ward_code = dto.returnWardCode as any; // can be ""

      if (dto.coupon !== undefined) payload.coupon = dto.coupon;

      // Clean optional station ids if falsy (GHN rejects 0)
      if (!payload.pick_station_id) delete payload.pick_station_id;
      if (!payload.deliver_station_id) delete payload.deliver_station_id;

      console.log(payload);
      const bodyObj = this.removeUndefined(payload);

      this.logger.debug(
        `[GHN] Creating shipping order for order #${dto.orderId}`,
      );
      this.logger.debug(`[GHN] Body: ${JSON.stringify(bodyObj)}`);
      const response = await this.axiosInstance.post(
        '/shiip/public-api/v2/shipping-order/create',
        bodyObj,
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (response.status >= 400) {
        throw new Error(
          (response.data &&
            (response.data.message || JSON.stringify(response.data))) ||
            `GHN error ${response.status}`,
        );
      }

      if (response.data?.code === 200 && response.data?.data) {
        const orderCode = response.data.data.order_code;
        console.log('ok');
        // Lưu thông tin GHN vào order
        // order.ghnOrderCode = orderCode;
        // await this.orderRepo.save(order);
        // shipmentOrder.ghnOrderCode = orderCode;
        // await this.shipmentRepo.save(shipmentOrder);

        this.logger.log(
          `[GHN] Created shipping order: ${orderCode} for order #${dto.orderId}`,
        );
        return {
          success: true,
          orderCode,
          data: response.data.data,
        };
      } else {
        this.logger.error(
          `[GHN] Failed to create shipping order: ${JSON.stringify(response.data)}`,
        );
        throw new Error(response.data?.message || 'Không thể tạo đơn hàng GHN');
      }
    } catch (error: any) {
      this.logger.error(
        `[GHN] Error creating shipping order: ${error.message}`,
      );
      if (error.response?.data) {
        this.logger.error(
          `[GHN] Response: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Tính phí vận chuyển
   */
  async calculateShippingFee(dto: CalculateShippingFeeDto) {
    try {
      const ghnConfig = config.GHN;
      const weight = dto.weight;
      const length = dto.length ?? 20;
      const width = dto.width ?? 15;
      const height = dto.height ?? 10;

      const payload: Record<string, any> = {
        from_district_id:
          dto.fromDistrictId ?? ghnConfig?.FROM_DISTRICT_ID,
        from_ward_code: dto.fromWardCode ?? ghnConfig?.FROM_WARD_CODE,
        to_district_id: dto.toDistrictId,
        to_ward_code: dto.toWardCode,
        weight,
        length,
        width,
        height,
        insurance_value: dto.insuranceValue ?? 0,
      };

      payload.service_type_id = dto.serviceTypeId ?? 2;

      const resolvedServiceId =
        dto.serviceId && dto.serviceId > 0
          ? dto.serviceId
          : await this.getAvailableServiceId(
              payload.from_district_id,
              dto.toDistrictId,
              payload.service_type_id,
            );

      if (!resolvedServiceId) {
        throw new Error('Không tìm thấy dịch vụ GHN phù hợp');
      }

      payload.service_id = resolvedServiceId;

      if (dto.codAmount !== undefined) payload.cod_amount = dto.codAmount;
      if (dto.codFailedAmount !== undefined)
        payload.cod_failed_amount = dto.codFailedAmount;
      if (dto.coupon !== undefined) payload.coupon = dto.coupon;
      if (dto.items && dto.items.length > 0) {
        payload.items = dto.items.map((item) => ({
          ...item,
          category: { ...item.category },
        }));
      }

      const feeBody = this.removeUndefined(payload);

      this.logger.debug(`[GHN] Calculating shipping fee`);
      this.logger.debug(`[GHN] Body: ${JSON.stringify(feeBody)}`);
      const response = await this.axiosInstance.post(
        '/shiip/public-api/v2/shipping-order/fee',
        feeBody,
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (response.status >= 400) {
        throw new Error(
          (response.data &&
            (response.data.message || JSON.stringify(response.data))) ||
            `GHN error ${response.status}`,
        );
      }

      if (response.data?.code === 200) {
        return {
          success: true,
          total: response.data.data.total,
          service_fee: response.data.data.service_fee,
          insurance_fee: response.data.data.insurance_fee,
          pick_station_fee: response.data.data.pick_station_fee,
          coupon_value: response.data.data.coupon_value,
          r2s_fee: response.data.data.r2s_fee,
          return_again: response.data.data.return_again,
          document_return: response.data.data.document_return,
          double_check: response.data.data.double_check,
          cod_fee: response.data.data.cod_fee,
          pick_remote_areas_fee: response.data.data.pick_remote_areas_fee,
          deliver_remote_areas_fee: response.data.data.deliver_remote_areas_fee,
          pick_remote_areas_fee_return:
            response.data.data.pick_remote_areas_fee_return,
          deliver_remote_areas_fee_return:
            response.data.data.deliver_remote_areas_fee_return,
        };
      } else {
        this.logger.error(
          `[GHN] Failed to calculate fee: ${JSON.stringify(response.data)}`,
        );
        throw new Error(
          response.data?.message || 'Không thể tính phí vận chuyển',
        );
      }
    } catch (error: any) {
      this.logger.error(`[GHN] Error calculating fee: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(
          `[GHN] Response: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Hủy đơn hàng giao hàng
   */
  async cancelShippingOrder(orderCode: string) {
    try {
      const payload = {
        order_codes: [orderCode],
      };

      this.logger.debug(`[GHN] Canceling shipping order: ${orderCode}`);
      const response = await this.axiosInstance.post(
        '/shiip/public-api/v2/switch-status/cancel',
        payload,
      );

      if (response.data?.code === 200) {
        // Cập nhật order trong database
        const order = await this.orderRepo.findOne({
          where: { ghnOrderCode: orderCode },
        });
        if (order) {
          order.ghnOrderCode = null;
          await this.orderRepo.save(order);
        }

        this.logger.log(`[GHN] Canceled shipping order: ${orderCode}`);
        return {
          success: true,
          message: 'Hủy đơn hàng thành công',
        };
      } else {
        this.logger.error(
          `[GHN] Failed to cancel order: ${JSON.stringify(response.data)}`,
        );
        throw new Error(response.data?.message || 'Không thể hủy đơn hàng');
      }
    } catch (error: any) {
      this.logger.error(`[GHN] Error canceling order: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(
          `[GHN] Response: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Lấy thông tin đơn hàng
   */
  async getOrderInfo(orderCode: string) {
    try {
      this.logger.debug(`[GHN] Getting order info: ${orderCode}`);
      const response = await this.axiosInstance.post(
        '/shiip/public-api/v2/shipping-order/detail',
        {
          order_code: orderCode,
        },
      );

      if (response.data?.code === 200) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        this.logger.error(
          `[GHN] Failed to get order info: ${JSON.stringify(response.data)}`,
        );
        throw new Error(
          response.data?.message || 'Không thể lấy thông tin đơn hàng',
        );
      }
    } catch (error: any) {
      this.logger.error(`[GHN] Error getting order info: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(
          `[GHN] Response: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách tỉnh/thành phố
   */
  async getProvinces() {
    try {
      const response = await this.axiosInstance.get(
        '/shiip/public-api/master-data/province',
      );

      if (response.data?.code === 200) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(
          response.data?.message || 'Không thể lấy danh sách tỉnh/thành phố',
        );
      }
    } catch (error: any) {
      this.logger.error(`[GHN] Error getting provinces: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy danh sách quận/huyện theo tỉnh/thành phố
   */
  async getDistricts(provinceId: number) {
    try {
      const response = await this.axiosInstance.get(
        '/shiip/public-api/master-data/district',
        {
          params: { province_id: provinceId },
        },
      );

      if (response.data?.code === 200) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(
          response.data?.message || 'Không thể lấy danh sách quận/huyện',
        );
      }
    } catch (error: any) {
      this.logger.error(`[GHN] Error getting districts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy danh sách phường/xã theo quận/huyện
   */
  async getWards(districtId: number) {
    try {
      const response = await this.axiosInstance.get(
        '/shiip/public-api/master-data/ward',
        {
          params: { district_id: districtId },
        },
      );

      if (response.data?.code === 200) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(
          response.data?.message || 'Không thể lấy danh sách phường/xã',
        );
      }
    } catch (error: any) {
      this.logger.error(`[GHN] Error getting wards: ${error.message}`);
      throw error;
    }
  }

  async getShiftDate() {
    try {
      const response = await this.axiosInstance.get(
        '/shiip/public-api/v2/shift/date',
      );

      if (response.data?.code === 200) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(
          response.data?.message || 'Không thể lấy danh sách ca vận chuyển',
        );
      }
    } catch (error: any) {
      this.logger.error(`[GHN] Error getting shift-date: ${error.message}`);
      throw error;
    }
  }

  async updateCod(dto: UpdateCodDto) {
    try {
      const payload = {
        order_code: dto.orderCode,
        cod_amount: dto.codAmount,
      };

      this.logger.debug(`[GHN] Update shipping order: ${dto.orderCode}`);
      const response = await this.axiosInstance.post(
        '/shiip/public-api/v2/shipping-order/updateCOD',
        payload,
      );

      if (response.data?.code === 200) {
        this.logger.log(`[GHN] Update shipping order: ${dto.orderCode}`);
        return {
          success: true,
          message: 'Update cod thành công',
        };
      } else {
        this.logger.error(
          `[GHN] Failed to update cod: ${JSON.stringify(response.data)}`,
        );
        throw new Error(response.data?.message || 'Không thể update cod');
      }
    } catch (error: any) {
      this.logger.error(`[GHN] Error update order: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(
          `[GHN] Response: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }
}
