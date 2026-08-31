/**
 * Interface chuẩn hóa response cho mọi endpoint có phân trang.
 *
 * Response format:
 * {
 *   "data": [...],
 *   "meta": { "page": 1, "limit": 20, "totalItems": 150, "totalPages": 8 }
 * }
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
