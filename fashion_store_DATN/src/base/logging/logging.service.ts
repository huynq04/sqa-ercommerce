import { Injectable } from '@nestjs/common';
import { configure, getLogger, Logger } from 'log4js';

@Injectable()
export class LoggingService {
  constructor() {
    configure({
      appenders: {
        console: { type: 'console' },
        file: {
          type: 'dateFile',
          filename: 'logs/app.log',
          pattern: 'yyyy-MM-dd',
          keepFileExt: true,
        },
        errorFile: {
          type: 'dateFile',
          filename: 'logs/error.log',
          pattern: 'yyyy-MM-dd',
          keepFileExt: true,
        },
        errorFilter: {
          type: 'logLevelFilter',
          appender: 'errorFile',
          level: 'error',
        },
      },
      categories: {
        default: {
          appenders: ['console', 'file', 'errorFilter'],
          level: 'info',
        },
      },
    });
  }

  /**
   * Trả về logger theo tên category (vd: 'Bootstrap', 'UserService' ...)
   */
  getLogger(category = 'default'): Logger {
    return getLogger(category);
  }

  /**
   * Log lỗi đơn giản (dùng trong catch)
   */
  logError(error: any) {
    const logger = this.getLogger('Error');
    logger.error(error?.message || error);
  }
}
