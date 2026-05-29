'use client';

import type { PaginationMeta } from '@src/shared/types';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@src/shared/components/ui/pagination';

interface DataTablePaginationProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  label?: string;
}

export function DataTablePagination({
  meta,
  onPageChange,
  label = 'records',
}: DataTablePaginationProps) {
  if (!meta || meta.totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (meta.totalPages <= maxVisible) {
      for (let i = 1; i <= meta.totalPages; i++) {
        pages.push(i);
      }
    } else if (meta.page <= 3) {
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i);
      }
    } else if (meta.page >= meta.totalPages - 2) {
      for (let i = meta.totalPages - 4; i <= meta.totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = meta.page - 2; i <= meta.page + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const startItem = (meta.page - 1) * meta.pageSize + 1;
  const endItem = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-body">
        Showing <span className="font-medium text-body-strong">{startItem}</span> to{' '}
        <span className="font-medium text-body-strong">{endItem}</span> of{' '}
        <span className="font-medium text-body-strong">{meta.total.toLocaleString()}</span> {label}
      </p>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(meta.page - 1)}
              className={meta.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>

          {getPageNumbers().map((pageNum) => (
            <PaginationItem key={pageNum}>
              <PaginationLink
                onClick={() => onPageChange(pageNum)}
                isActive={meta.page === pageNum}
                className="cursor-pointer"
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          ))}

          {meta.totalPages > 5 && meta.page < meta.totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(meta.page + 1)}
              className={
                meta.page >= meta.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
