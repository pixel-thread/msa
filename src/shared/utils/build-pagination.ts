import { PaginationMeta } from "../types";

export const buildPagination = (
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
};
