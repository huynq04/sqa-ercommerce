// // src/middleware/access-logger.middleware.ts
// import { Injectable, NestMiddleware } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
// import * as fs from 'fs';
// import * as path from 'path';
//
// @Injectable()
// export class AccessLoggerMiddleware implements NestMiddleware {
//   private readonly logDir = path.join(process.cwd(), 'logs');
//   private readonly accessLogFile = path.join(this.logDir, 'access.log');
//
//   constructor() {
//     if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir);
//   }
//
//   use(req: Request, res: Response, next: NextFunction) {
//     const startTime = process.hrtime();
//
//     res.on('finish', () => {
//       const diff = process.hrtime(startTime);
//       const responseTime = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(3);
//       const user = (req as any).user?.username || 'Anonymous';
//       const ip = req.ip || req.socket?.remoteAddress;
//
//       const logLine = `ACCESS ${new Date().toISOString()}  ${ip}  | ${user} ${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms (access)\n`;
//       console.log(logLine.trim());
//       fs.appendFileSync(this.accessLogFile, logLine);
//     });
//
//     next();
//   }
// }

// import { Injectable, NestMiddleware } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
// import * as fs from 'fs';
// import * as path from 'path';
//
// @Injectable()
// export class AccessLoggerMiddleware implements NestMiddleware {
//   private readonly logDir = path.join(process.cwd(), 'logs');
//   private readonly accessLogFile = path.join(this.logDir, 'access.log');
//   private readonly debugLogFile = path.join(this.logDir, 'http-exception.log');
//
//   constructor() {
//     if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir);
//   }
//
//   use(req: Request, res: Response, next: NextFunction) {
//     const startTime = process.hrtime();
//
//     const originalSend = res.send.bind(res);
//     res.send = (body?: any) => {
//       try {
//         const data = typeof body === 'string' ? JSON.parse(body) : body;
//
//         // Log debug nếu API trả về success: false
//         if (data?.success === false) {
//           const debugLogLine = `DEBUG  ${new Date().toISOString()} middleware\\http-exce | ${
//             res.statusCode
//           } ${JSON.stringify(data, null, 2)} (http-exception)\n`;
//           console.error(debugLogLine.trim());
//           fs.appendFileSync(this.debugLogFile, debugLogLine);
//         }
//       } catch {
//         // Không parse JSON → bỏ qua
//       }
//
//       return originalSend(body);
//     };
//
//     res.on('finish', () => {
//       const diff = process.hrtime(startTime);
//       const responseTime = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(3);
//       const user = (req as any).user?.username || 'Anonymous';
//       const ip = req.ip || req.socket?.remoteAddress;
//
//       const accessLogLine = `ACCESS ${new Date().toISOString()}  ${ip}  | ${user} ${req.method} ${
//         req.originalUrl
//       } ${res.statusCode} - ${responseTime}ms (access)\n`;
//
//       console.log(accessLogLine.trim());
//       fs.appendFileSync(this.accessLogFile, accessLogLine);
//     });
//
//     next();
//   }
// }

// src/middleware/access-logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AccessLoggerMiddleware implements NestMiddleware {
  private readonly logDir = path.join(process.cwd(), 'logs');
  private readonly accessLogFile = path.join(this.logDir, 'access.log');
  private readonly debugLogFile = path.join(this.logDir, 'http-exception.log');

  constructor() {
    if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = process.hrtime();
    let debugLogged = false;

    const originalSend = res.send.bind(res);
    res.send = (body?: any) => {
      if (!debugLogged && !res.headersSent) {
        try {
          const data = typeof body === 'string' ? JSON.parse(body) : body;

          // Log debug nếu status >= 400 hoặc success false
          if (res.statusCode >= 400 || data?.success === false) {
            debugLogged = true;
            const debugLogLine = `DEBUG  ${new Date().toISOString()} middleware\\http-exce | ${
              res.statusCode
            } ${JSON.stringify(data, null, 2)} (http-exception)\n`;
            console.error(debugLogLine.trim());
            fs.appendFileSync(this.debugLogFile, debugLogLine);
          }
        } catch {
          // Không parse JSON → bỏ qua
        }
      }
      return originalSend(body);
    };

    res.on('finish', () => {
      const diff = process.hrtime(startTime);
      const responseTime = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(3);
      const user = (req as any).user?.username || 'Anonymous';
      const ip = req.ip || req.socket?.remoteAddress;

      const accessLogLine = `ACCESS ${new Date().toISOString()}  ${ip}  | ${user} ${req.method} ${
        req.originalUrl
      } ${res.statusCode} - ${responseTime}ms (access)\n`;

      console.log(accessLogLine.trim());
      fs.appendFileSync(this.accessLogFile, accessLogLine);
    });

    next();
  }

}
