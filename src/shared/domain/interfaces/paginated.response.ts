/**
 * Generic paginated response envelope returned by all list endpoints.
 *
 * @typeParam T - The type of items in the result set
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
