export interface PaginationRequest {
  pageSize: number;
  pageNumber: number;
  startDate: Date;
  endDate: Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
