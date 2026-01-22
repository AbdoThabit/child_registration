import { ApiProperty } from '@nestjs/swagger';

export class Meta {
    @ApiProperty()
    apiVersion: string;

    @ApiProperty()
    requestId: string;

    @ApiProperty()
    timestamp: string;
}

export class Pagination {
    @ApiProperty()
    total: number;

    @ApiProperty()
    count: number;

    @ApiProperty()
    per_page: number;

    @ApiProperty()
    current_page: number;

    @ApiProperty()
    total_pages: number;

    @ApiProperty({ required: false })
    links?: {
        self?: string;
        first?: string;
        next?: string | null;
        previous?: string | null;
        last?: string;
    };
}

export class PaginatedServiceResponse<T> {
    data: T[]; 

    @ApiProperty({ type: Pagination })
    pagination: Pagination;
}

export class ApiError {
    @ApiProperty()
    status: string;

    @ApiProperty()
    code: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    detail: { field: string; message: string } | string;

    @ApiProperty({ required: false })
    source?: { pointer: string };
}

export class ApiResponse<T> {
    @ApiProperty()
    jsonapi: { version: string };

    @ApiProperty({ type: Meta })
    meta: Meta;

    @ApiProperty({ required: false })
    message?: string;

    data: T | null;

    @ApiProperty({ type: Pagination, required: false })
    pagination?: Pagination;

    @ApiProperty({ type: [ApiError], required: false, nullable: true })
    errors: ApiError[] | null;
}

