import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from '@app.controller';
import { AppService } from '@app.service';
import { ConfigModule } from '@config';
import { MysqlModule } from '@base/db/mysql/mysql.module';
import { RedisCacheModule } from '@base/db/redis/redis.module';
import { LoggingModule } from '@base/logging';
import { AccessLoggerMiddleware } from '@base/middleware/access-logger.middleware';
import { MailModule } from '@base/mail/mail.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/user/user.module';
import { S3Module } from '@base/s3/s3.module';
import { EcommerceModule } from '@modules/ecommerce/ecommerce.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule,
    MysqlModule,
    RedisCacheModule,
    LoggingModule,
    MailModule,
    AuthModule,
    UsersModule,
    S3Module,
    EcommerceModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AccessLoggerMiddleware).forRoutes('*');
  }
}
