/**
 * Pagination metadata for list responses.
 *
 * Used by pagination component to display page information
 * and enable/disable navigation buttons.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
