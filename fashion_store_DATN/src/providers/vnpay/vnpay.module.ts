import { Module } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { VnpayController } from './vnpay.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '@modules/ecommerce/entities/order.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, ProductVariant]),
  ],
  controllers: [VnpayController],
  providers: [VnpayService],
})
export class VnpayModule {}
