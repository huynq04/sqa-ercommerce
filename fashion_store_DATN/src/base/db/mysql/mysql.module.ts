import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from '@config/config.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: config.DB.HOST,
      port: config.DB.PORT,
      username: config.DB.USER,
      password: config.DB.PASSWORD,
      database: config.DB.NAME,
      synchronize: false, // chỉ true khi dev
      autoLoadEntities: true,
    }),
  ],
  exports: [TypeOrmModule],
})
export class MysqlModule {}
