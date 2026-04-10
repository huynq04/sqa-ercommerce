import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as qs from 'qs';
import * as crypto from 'crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { config } from '@config';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '@modules/ecommerce/entities/order.entity';
import { Repository } from 'typeorm';

dayjs.extend(utc);
dayjs.extend(timezone);
const VNTZ = 'Asia/Ho_Chi_Minh';

function sortObject<T extends Record<string, any>>(obj: T): T {
  const sorted: Record<string, any> = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => (sorted[k] = obj[k]));
  return sorted as T;
}

// Encoder giống PHP http_build_query: space -> '+'
function phpLikeEncoder(str: any) {
  return encodeURIComponent(String(str))
    .replace(/%20/g, '+')
    .replace(
      /[!'()*]/g,
      (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
    );
}

@Injectable()
export class VnpayService {
  private readonly logger = new Logger('VNPay');
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}
  async createPaymentUrl(params: {
    orderId: number;
    amount: number;
    orderInfo: string;
    orderType?: string;
    locale?: 'vn' | 'en';
    bankCode?: string;
    clientIp?: string;
    expireMinutes?: number;
  }) {
    const {
      orderId,
      amount,
      orderInfo,
      orderType = 'other',
      locale = 'vn',
      bankCode,
      clientIp = '127.0.0.1',
      expireMinutes = 15,
    } = params;

    if (!config.VN_PAY.RETURN_URL)
      throw new Error('VNP_RETURN_URL is empty – set it in .env');

    const createDate = dayjs().tz(VNTZ).format('YYYYMMDDHHmmss');
    const expireDate = dayjs()
      .tz(VNTZ)
      .add(expireMinutes, 'minute')
      .format('YYYYMMDDHHmmss');
    const vnp_TransDate = createDate;
    const amount100 = String(Math.round(amount) * 100);
    const vnp_TxnRefs = `${orderId}_${Date.now()}`;
    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: config.VN_PAY.TMN_CODE,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: vnp_TxnRefs,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: amount100,
      vnp_ReturnUrl: config.VN_PAY.RETURN_URL,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };
    if (bankCode) vnpParams['vnp_BankCode'] = bankCode;

    // === KÝ: dùng encoder PHP-like (space -> '+')
    const sorted = sortObject(vnpParams);
    const signData = qs.stringify(sorted, {
      encode: true,
      encoder: phpLikeEncoder,
    });

    const secureHash = crypto
      .createHmac('sha512', config.VN_PAY.HASH_SECRET)
      .update(signData, 'utf-8')
      .digest('hex');

    // === TRẢ URL: encode bình thường cho trình duyệt
    const final = {
      ...sorted,
      vnp_SecureHash: secureHash,
      vnp_SecureHashType: 'HMACSHA512',
    };
    const query = qs.stringify(final, { encode: true, format: 'RFC3986' });
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    order.vnpTransDate = vnp_TransDate;
    order.vnpTxnRef = vnp_TxnRefs;
    await this.orderRepo.save(order);

    // Debug khi cần
    // console.log('[VNPAY] CREATE signData =', signData);
    // console.log('[VNPAY] CREATE secureHash =', secureHash);
    // console.log('[VNPAY] CREATE payUrl =', `${config.VN_PAY.API_URL}?${query}`);
    this.logger.debug(
      `[VNPAY] CREATE payUrl = ${config.VN_PAY.API_URL}?${query}`,
    );
    return `${config.VN_PAY.API_URL}?${query}`;
  }

  verifyReturnOrIpn(queryObj: Record<string, string | string[]>): {
    isValid: boolean;
    data: Record<string, string>;
    receivedHash: string;
  } {
    const obj: Record<string, string> = {};
    Object.keys(queryObj).forEach((k) => {
      const v = (queryObj as any)[k];
      obj[k] = Array.isArray(v) ? v[0] : String(v ?? '');
    });

    const receivedHash = obj['vnp_SecureHash'] || '';
    delete obj['vnp_SecureHash'];
    delete obj['vnp_SecureHashType'];

    const sorted = sortObject(obj);

    // PHẢI dùng cùng encoder như khi ký
    const signData = qs.stringify(sorted, {
      encode: true,
      encoder: phpLikeEncoder,
    });
    const calculatedHash = crypto
      .createHmac('sha512', config.VN_PAY.HASH_SECRET)
      .update(signData, 'utf-8')
      .digest('hex');

    // Debug khi cần
    // console.log('[VNPAY] VERIFY signData =', signData);
    // console.log('[VNPAY] VERIFY receivedHash =', receivedHash);
    // console.log('[VNPAY] VERIFY calculatedHash =', calculatedHash);

    return {
      isValid: calculatedHash === receivedHash,
      data: sorted,
      receivedHash,
    };
  }

  /**
   * Gọi API QueryDR để kiểm tra giao dịch
   * (dùng cho cron hoặc kiểm tra thủ công)
   */
  async checkTransaction(orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order #${orderId} không tồn tại`);

    const requestId = Date.now().toString();
    const createDate = dayjs().tz(VNTZ).format('YYYYMMDDHHmmss');

    // Nối dữ liệu theo spec QueryDR mới
    const dataStr = [
      requestId,
      '2.1.0',
      'querydr',
      config.VN_PAY.TMN_CODE,
      order.vnpTxnRef,
      order.vnpTransDate, // vnp_TransactionDate lúc tạo URL
      createDate,
      '127.0.0.1',
      `Check order ${orderId}`, // vnp_OrderInfo
    ].join('|');

    const secureHash = crypto
      .createHmac('sha512', config.VN_PAY.HASH_SECRET)
      .update(dataStr, 'utf-8')
      .digest('hex');

    const body = {
      vnp_RequestId: requestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: config.VN_PAY.TMN_CODE,
      vnp_TxnRef: order.vnpTxnRef,
      vnp_TransactionDate: order.vnpTransDate,
      vnp_CreateDate: createDate,
      vnp_IpAddr: '127.0.0.1',
      vnp_OrderInfo: `Check order ${orderId}`,
      vnp_SecureHash: secureHash,
    };

    this.logger.debug(`[VNPay] QueryDR Request: ${config.VN_PAY.QUERY_DR_URL}`);
    this.logger.debug(`[VNPay] Payload: ${JSON.stringify(body, null, 2)}`);

    try {
      const res = await axios.post(config.VN_PAY.QUERY_DR_URL, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      this.logger.debug(
        `[VNPay] QueryDR Response: ${JSON.stringify(res.data)}`,
      );
      return res.data;
    } catch (error: any) {
      this.logger.error(
        `VNPay QueryDR lỗi cho order #${orderId}: ${error.message}`,
      );
      this.logger.error(error.response?.data || error.stack);
      throw error;
    }
  }
}
