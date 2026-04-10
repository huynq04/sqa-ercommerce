import { Module } from '@nestjs/common';
import { GhnService } from './ghn.service';
import { GhnController } from './ghn.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '@modules/ecommerce/entities/order.entity';
import { ShipmentOrder } from '@modules/ecommerce/entities/shipmentOrder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, ShipmentOrder])],
  controllers: [GhnController],
  providers: [GhnService],
  exports: [GhnService],
})
export class GhnModule {}









