import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '@modules/ecommerce/entities/order.entity';
import { BaseService } from '@base/services/base.service';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';
import { PaginatedResult } from '@base/dtos/paginated-result.dto';

@Injectable()
export class AdminOrderService extends BaseService<Order> {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {
    super(orderRepo, 'order');
  }

  async listAll(query: QuerySpecificationDto): Promise<PaginatedResult<Order>> {
    query.searchFields = ['shippingAddress', 'status'];

    return this.listPaginate(query, {
      relations: ['user', 'items', 'items.variant', 'items.variant.product'],
      order: { createdAt: 'DESC' },
    });
  }
}
