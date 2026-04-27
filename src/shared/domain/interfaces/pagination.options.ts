/**
 * Query parameters for paginated list requests.
 * `page` is 1-based; default values are enforced at the controller/DTO layer.
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}
