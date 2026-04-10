import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Order, OrderStatus } from '@modules/ecommerce/entities/order.entity';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { BestSellerFilterDto, ReportFilterDto } from '../dtos/report.dto';

@Injectable()
export class AdminReportService {
  private readonly completedStatuses = [
    // OrderStatus.CONFIRMED,
    OrderStatus.COMPLETED,
  ];

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  private applyDateFilters<T>(
    qb: SelectQueryBuilder<T>,
    filter: ReportFilterDto,
  ) {
    if (filter.startDate) {
      const start = new Date(filter.startDate);
      start.setHours(0, 0, 0, 0);
      qb.andWhere('order.createdAt >= :startDate', {
        startDate: start,
      });
    }
    if (filter.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('order.createdAt <= :endDate', {
        endDate: end,
      });
    }
  }

  async getRevenueOverview(filter: ReportFilterDto) {
    const baseOrderQb = this.orderRepo
      .createQueryBuilder('order')
      .where('order.orderStatus IN (:...statuses)', {
        statuses: this.completedStatuses,
      });

    this.applyDateFilters(baseOrderQb, filter);

    const { totalRevenue, totalOrders } = await baseOrderQb
      .select('COALESCE(SUM(order.totalAmount), 0)', 'totalRevenue')
      .addSelect('COUNT(DISTINCT order.id)', 'totalOrders')
      .getRawOne<{ totalRevenue: string; totalOrders: string }>();

    const orderItemQb = this.orderItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .where('order.orderStatus IN (:...statuses)', {
        statuses: this.completedStatuses,
      });

    this.applyDateFilters(orderItemQb, filter);

    const { productsSold } = await orderItemQb
      .select('COALESCE(SUM(item.quantity), 0)', 'productsSold')
      .getRawOne<{ productsSold: string }>();

    const revenue = Number(totalRevenue) || 0;
    const ordersCount = Number(totalOrders) || 0;
    const sold = Number(productsSold) || 0;

    return {
      totalRevenue: revenue,
      totalOrders: ordersCount,
      averageOrderValue: ordersCount ? revenue / ordersCount : 0,
      productsSold: sold,
    };
  }

  async getMonthlyRevenue(filter: ReportFilterDto) {
    const defaultStart = new Date(2025, 0, 1);
    const defaultEnd = new Date();
    const start = filter.startDate ? new Date(filter.startDate) : defaultStart;
    const end = filter.endDate ? new Date(filter.endDate) : defaultEnd;

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      const temp = new Date(start);
      start.setTime(end.getTime());
      end.setTime(temp.getTime());
    }

    const qb = this.orderRepo
      .createQueryBuilder('order')
      .where('order.orderStatus IN (:...statuses)', {
        statuses: this.completedStatuses,
      })
      .andWhere('order.createdAt >= :startDate', { startDate: start })
      .andWhere('order.createdAt <= :endDate', { endDate: end });

    const rows = await qb
      .select("DATE_FORMAT(order.createdAt, '%Y-%m')", 'month')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'revenue')
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; revenue: string }>();

    const revenueByMonth = new Map(
      rows.map((row) => [row.month, Number(row.revenue) || 0]),
    );

    const result: { month: string; revenue: number }[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (cursor <= endMonth) {
      const monthKey = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1,
      ).padStart(2, '0')}`;
      result.push({
        month: monthKey,
        revenue: revenueByMonth.get(monthKey) ?? 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return result;
  }

  async getBestSellerProducts(filter: BestSellerFilterDto) {
    const limit =
      filter.limit && filter.limit > 0 && filter.limit <= 50
        ? filter.limit
        : 10;

    const qb = this.orderItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .innerJoin('item.variant', 'variant')
      .innerJoin('variant.product', 'product')
      .where('order.orderStatus IN (:...statuses)', {
        statuses: this.completedStatuses,
      });

    this.applyDateFilters(qb, filter);

    const rows = await qb
      .select('product.id', 'productId')
      .addSelect('product.name', 'name')
      .addSelect('product.mainImageUrl', 'imageUrl')
      .addSelect('SUM(item.quantity)', 'totalSold')
      .addSelect('SUM(item.quantity * item.price)', 'revenue')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.mainImageUrl')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany<{
        productId: string;
        name: string;
        imageUrl: string;
        totalSold: string;
        revenue: string;
      }>();

    return rows.map((row) => ({
      productId: Number(row.productId),
      name: row.name,
      imageUrl: row.imageUrl,
      totalSold: Number(row.totalSold) || 0,
      revenue: Number(row.revenue) || 0,
    }));
  }

  async getProductSales(filter: ReportFilterDto) {
    const salesQb = this.orderItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order', 'order.orderStatus IN (:...statuses)', {
        statuses: this.completedStatuses,
      })
      .innerJoin('item.variant', 'variant')
      .innerJoin('variant.product', 'product');

    this.applyDateFilters(salesQb, filter);

    const salesSubQuery = salesQb
      .select('product.id', 'productId')
      .addSelect('SUM(item.quantity)', 'totalSold')
      .addSelect('SUM(item.quantity * item.price)', 'revenue')
      .groupBy('product.id');

    const rows = await this.productRepo
      .createQueryBuilder('product')
      .leftJoin(
        `(${salesSubQuery.getQuery()})`,
        'sales',
        'sales.productId = product.id',
      )
      .setParameters(salesSubQuery.getParameters())
      .select('product.id', 'productId')
      .addSelect('product.name', 'name')
      .addSelect('product.mainImageUrl', 'imageUrl')
      .addSelect('COALESCE(sales.totalSold, 0)', 'totalSold')
      .addSelect('COALESCE(sales.revenue, 0)', 'revenue')
      .orderBy('totalSold', 'DESC')
      .addOrderBy('product.id', 'ASC')
      .getRawMany<{
        productId: string;
        name: string;
        imageUrl: string;
        totalSold: string;
        revenue: string;
      }>();

    return rows.map((row) => ({
      productId: Number(row.productId),
      name: row.name,
      imageUrl: row.imageUrl,
      totalSold: Number(row.totalSold) || 0,
      revenue: Number(row.revenue) || 0,
    }));
  }
}
