import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic HTTP response DTO for paginated list endpoints.
 * Wraps a typed item array with pagination metadata serialised for Swagger.
 *
 * @typeParam T - The type of items in the `data` array
 */
export class PaginatedDto<T> {
  @ApiProperty({ isArray: true })
  readonly data: T[];

  @ApiProperty({ example: 100, description: 'Total de itens' })
  readonly total: number;

  @ApiProperty({ example: 1, description: 'Página atual' })
  readonly page: number;

  @ApiProperty({ example: 10, description: 'Limite de itens por página' })
  readonly limit: number;

  @ApiProperty({ example: 10, description: 'Total de páginas' })
  readonly totalPages: number;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
