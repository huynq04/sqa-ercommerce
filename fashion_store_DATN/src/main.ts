// import { NestFactory } from '@nestjs/core';
// import { NestExpressApplication } from '@nestjs/platform-express';
// import helmet from 'helmet';
// import * as bodyParser from 'body-parser';
// import rateLimit from 'express-rate-limit';
// import { ValidationPipe } from '@nestjs/common';
//
// import { AppModule } from '@app.module';
// import { initSwagger } from '@base/swagger';
// import { config } from '@config';
//
// async function bootstrap() {
//   const app = await NestFactory.create<NestExpressApplication>(AppModule);
//
//   app.enableCors({
//     origin: '*',
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   });
//   app.setGlobalPrefix('api/v1');
//
//   app.use(helmet());
//   app.use(bodyParser.json({ limit: '10mb' }));
//   app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));
//
//   app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
//
//   initSwagger(app);
//
//   await app.listen(config.PORT);
//   console.log('====================================');
//   console.log(`🚀 Environment: ${config.NODE_ENV}`);
//   console.log(`🌐 Server running on: ${config.HOST}`);
//   console.log(`📘 Swagger docs: ${config.HOST}/apidoc`);
//   console.log('====================================');
// }
//
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from '@app.module';
import { initSwagger } from '@base/swagger';
import { config } from '@config';
import { LoggingService } from '@base/logging';
import { HttpExceptionLoggerFilter } from '@base/filters/http-exception.filter';
import { AccessLoggerMiddleware } from '@base/middleware/access-logger.middleware';

async function bootstrap() {
  // ===== Create App =====
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true, // giúp log có thể ghi lại trước khi app load xong
  });

  // ===== Logging Service =====
  const loggingService = app.get(LoggingService);
  const logger = loggingService.getLogger('Bootstrap');

  // ===== Global Config =====
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix('api/v1');

  app.use(helmet());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionLoggerFilter());
  app.use(new AccessLoggerMiddleware().use.bind(new AccessLoggerMiddleware()));
  // ===== Swagger =====
  initSwagger(app);

  // ===== Start Server =====
  await app.listen(config.PORT);

  // ===== Logging Info =====
  logger.info('====================================');
  logger.info(`🚀 Environment: ${config.NODE_ENV}`);
  logger.info(`🌐 Server running on: ${config.HOST}`);
  logger.info(`📘 Swagger docs: ${config.HOST}/apidoc`);
  logger.info('====================================');
}

bootstrap().catch((error) => {
  // Nếu có lỗi khi khởi động, log ra file error.log
  console.error('❌ Error starting application:', error);
});
