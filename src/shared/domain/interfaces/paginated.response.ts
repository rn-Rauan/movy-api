/**
 * @param data - Array of paginated items
 * @param total - Total number of items matching the query
 * @param page - Current page number
 * @param limit - Maximum items per page
 * @param totalPages - Total number of pages
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
