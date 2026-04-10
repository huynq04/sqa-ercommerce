// // src/filters/http-exception.filter.ts
// import {
//   ExceptionFilter,
//   Catch,
//   ArgumentsHost,
//   HttpException,
//   HttpStatus,
// } from '@nestjs/common';
// import * as fs from 'fs';
// import * as path from 'path';
//
// @Catch()
// export class HttpExceptionLoggerFilter implements ExceptionFilter {
//   private readonly logDir = path.join(process.cwd(), 'logs');
//   private readonly debugLogFile = path.join(this.logDir, 'http-exception.log');
//
//   constructor() {
//     if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir);
//   }
//
//   catch(exception: any, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse();
//     const request = ctx.getRequest();
//
//     const status =
//       exception instanceof HttpException
//         ? exception.getStatus()
//         : HttpStatus.INTERNAL_SERVER_ERROR;
//
//     const body =
//       exception instanceof HttpException
//         ? exception.getResponse()
//         : {
//             success: false,
//             message: exception.message || 'Internal Server Error',
//           };
//
//     const user = (request as any).user?.username || 'Anonymous';
//     const ip = request.ip || request.socket?.remoteAddress;
//
//     const logLine = `DEBUG  ${new Date().toISOString()} middleware\\http-exce | ${status} ${JSON.stringify(body, null, 2)} (http-exception)\n`;
//     console.error(logLine.trim());
//     fs.appendFileSync(this.debugLogFile, logLine);
//
//     response.status(status).json(body);
//   }
// }

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Catch()
export class HttpExceptionLoggerFilter implements ExceptionFilter {
  private readonly logDir = path.join(process.cwd(), 'logs');
  private readonly debugLogFile = path.join(this.logDir, 'http-exception.log');

  constructor() {
    if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir);
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            success: false,
            message: exception.message || 'Internal Server Error',
          };

    const logLine = `DEBUG  ${new Date().toISOString()} middleware\\http-exce | ${status} ${JSON.stringify(
      body,
      null,
      2,
    )} (http-exception)\n`;

    console.error(logLine.trim());
    fs.appendFileSync(this.debugLogFile, logLine);

    response.status(status).json(body);
  }
}
