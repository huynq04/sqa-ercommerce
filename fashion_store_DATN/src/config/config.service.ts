import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();
process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';
const env = Object.assign({}, process.env);

@Injectable()
export class ConfigService {
  PORT: number = parseInt(env.PORT, 10);
  HOST: string = env.HOST || `http://localhost:${this.PORT}`;
  NODE_ENV: string = env.NODE_ENV;
  VERSION: string = env.VERSION || '1.0.0';
  PROJECT_NAME: string = env.PRODUCT_NAME;
  SWAGGER_CREDENTIALS = {
    name: env.SWAGGER_USER || 'admin',
    pass: env.SWAGGER_PASS || 'FASHION@2025',
  };

  // ===== MySQL =====
  DB = {
    HOST: env.DB_HOST || '172.16.12.217',
    PORT: parseInt(env.DB_PORT, 10) || 3307,
    USER: env.DB_USER || 'root',
    PASSWORD: env.DB_PASS || 'root',
    NAME: env.DB_NAME || 'fashion_store',
  };

  // ===== Redis =====
  REDIS = {
    HOST: env.REDIS_HOST || '172.16.12.217',
    PORT: parseInt(env.REDIS_PORT, 10) || 6379,
    PASSWORD: env.REDIS_PASSWORD || '',
  };

  // ==== Mail ====
  MAIL = {
    HOST: env.MAIL_HOST,
    PORT: parseInt(env.MAIL_PORT, 10),
    SECURE: env.MAIL_SECURE,
    USER: env.MAIL_USER,
    PASS: env.MAIL_PASS,
    FROM: env.MAIL_FROM,
  };

  S3 = {
    ENDPOINT: env.MINIO_ENDPOINT,
    ACCESS_KEY: env.MINIO_ACCESS_KEY,
    SECRET_KEY: env.MINIO_SECRET_KEY,
    REGION: env.MINIO_REGION,
  };
  VN_PAY = {
    TMN_CODE: env.VNP_TMN_CODE,
    HASH_SECRET: env.VNP_HASH_SECRET,
    API_URL: env.VNP_API_URL,
    RETURN_URL: env.VNP_RETURN_URL,
    QUERY_DR_URL: env.VNPAY_QUERY_DR_URL,
  };

  GHN = {
    TOKEN: env.GHN_TOKEN,
    SHOP_ID: env.GHN_SHOP_ID,
    API_URL: env.GHN_API_URL,
    FROM_NAME: env.GHN_FROM_NAME,
    FROM_PHONE: env.GHN_FROM_PHONE,
    FROM_ADDRESS: env.GHN_FROM_ADDRESS,
    FROM_WARD_NAME: env.GHN_FROM_WARD_NAME,
    FROM_WARD_CODE: env.GHN_FROM_WARD_CODE,
    FROM_DISTRICT_NAME: env.GHN_FROM_DISTRICT_NAME,
    FROM_DISTRICT_ID: env.GHN_FROM_DISTRICT_ID
      ? parseInt(env.GHN_FROM_DISTRICT_ID, 10)
      : undefined,
    FROM_PROVINCE_NAME: env.GHN_FROM_PROVINCE_NAME,
    FROM_PROVINCE_CODE: env.GHN_FROM_PROVINCE_CODE,
    RETURN_PHONE: env.GHN_RETURN_PHONE,
    RETURN_ADDRESS: env.GHN_RETURN_ADDRESS,
    RETURN_DISTRICT_ID: env.GHN_RETURN_DISTRICT_ID
      ? parseInt(env.GHN_RETURN_DISTRICT_ID, 10)
      : undefined,
    RETURN_WARD_CODE: env.GHN_RETURN_WARD_CODE,
    REQUIRED_NOTE: env.GHN_REQUIRED_NOTE,
    DEFAULT_SERVICE_ID: env.GHN_DEFAULT_SERVICE_ID
      ? parseInt(env.GHN_DEFAULT_SERVICE_ID, 10)
      : undefined,
    DEFAULT_SERVICE_TYPE_ID: env.GHN_DEFAULT_SERVICE_TYPE_ID
      ? parseInt(env.GHN_DEFAULT_SERVICE_TYPE_ID, 10)
      : undefined,
    DEFAULT_PICK_STATION_ID: env.GHN_DEFAULT_PICK_STATION_ID
      ? parseInt(env.GHN_DEFAULT_PICK_STATION_ID, 10)
      : undefined,
    DEFAULT_DELIVER_STATION_ID: env.GHN_DEFAULT_DELIVER_STATION_ID
      ? parseInt(env.GHN_DEFAULT_DELIVER_STATION_ID, 10)
      : undefined,
    DEFAULT_PICK_SHIFT: env.GHN_DEFAULT_PICK_SHIFT
      ? env.GHN_DEFAULT_PICK_SHIFT.split(',')
          .map((value) => parseInt(value.trim(), 10))
          .filter((value) => !Number.isNaN(value))
      : undefined,
  };

  CHATBOT = {
    CHATBOT_URL: env.CHATBOT_URL,
    API_KEY: env.API_KEY,
  };

  PAGINATION_PAGE_SIZE = parseInt(env.PAGINATION_PAGE_SIZE, 10) || 10;

  // ===== Helpers =====
  isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }
}

export const config = new ConfigService();
