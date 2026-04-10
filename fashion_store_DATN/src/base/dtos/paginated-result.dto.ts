import { ApiProperty } from '@nestjs/swagger';
import {QuerySpecificationDto} from "@base/dtos/query-specification.dto";


export class PaginatedResult<T> {
    @ApiProperty({ isArray: true })
    data: T[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    constructor(data: T[], query?: QuerySpecificationDto, meta?: { total: number }) {
        this.data = data;
        this.total = meta?.total ?? data.length;
        this.page = query?.page ?? 1;
        this.limit = query?.limit ?? 10;
    }
}
