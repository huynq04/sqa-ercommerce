import { Repository } from 'typeorm';
import { QuerySpecificationDto } from '@base/dtos/query-specification.dto';
import { PaginatedResult } from '@base/dtos/paginated-result.dto';
import { config } from '@config/config.service';

export abstract class BaseService<T> {
  constructor(
    protected readonly repo: Repository<T>,
    protected readonly alias: string,
  ) {}

  async listPaginate(
    query?: QuerySpecificationDto<any>,
    extra?: {
      relations?: string[];
      where?: Record<string, any>;
      order?: Record<string, 'ASC' | 'DESC'>;
    },
  ): Promise<PaginatedResult<T>> {
    const qb = this.repo.createQueryBuilder(this.alias);

    /*** 🔹 JOIN các quan hệ ***/
    if (extra?.relations?.length) {
      const joined = new Set<string>();
      for (const rel of extra.relations) {
        const parts = rel.split('.');
        let path = this.alias;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const alias = [...parts.slice(0, i + 1)].join('__');
          const joinPath = `${path}.${part}`;
          if (!joined.has(alias)) {
            qb.leftJoinAndSelect(joinPath, alias);
            joined.add(alias);
          }
          path = alias;
        }
      }
    }

    if (extra?.where) {
      Object.entries(extra.where).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          qb.andWhere(`${this.alias}.${field} = :${field}`, { [field]: value });
        }
      });
    }

    if (query?.q && query?.searchFields?.length) {
      const where = query.searchFields
        .map((f) => `${this.alias}.${f} LIKE :q`)
        .join(' OR ');
      qb.andWhere(`(${where})`, { q: `%${query.q}%` });
    }

    if (query?.filter && typeof query.filter === 'object') {
      Object.entries(query.filter).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          qb.andWhere(`${this.alias}.${field} = :${field}`, { [field]: value });
        }
      });
    }

    if (query?.sort && Object.keys(query.sort).length > 0) {
      Object.entries(query.sort).forEach(([field, direction]) => {
        qb.addOrderBy(
          `${this.alias}.${field}`,
          direction === -1 ? 'DESC' : 'ASC',
        );
      });
    } else if (extra?.order && Object.keys(extra.order).length > 0) {
      Object.entries(extra.order).forEach(([field, direction]) => {
        qb.addOrderBy(`${this.alias}.${field}`, direction);
      });
    } else {
      qb.addOrderBy(`${this.alias}.createdAt`, 'DESC');
    }

    const limit = query?.limit ?? config.PAGINATION_PAGE_SIZE ?? 10;
    const page = query?.page ?? 1;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResult(data, query, { total });
  }
}
