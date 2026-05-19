"use client";

import { useSearchParams, useRouter } from "next/navigation";

import { DataTable } from "@src/shared/components/data-table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@src/shared/components/ui/pagination";
import { useMembers } from "@src/features/members/hooks/useMembers";
import { useMemberTableColumns } from "@src/features/members/hooks/useMemberTableColumns";

export default function MembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const { members, meta, isLoading } = useMembers({ page: currentPage });
  const { columns } = useMemberTableColumns();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/members?${params.toString()}`);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Members
          </h1>
          <p className="mt-1 text-base text-body">
            Manage and view all association members
          </p>
        </div>
      </div>

      <DataTable loading={isLoading} data={members} columns={columns} />

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-body">
            Showing{" "}
            <span className="font-medium text-body-strong">
              {(meta.page - 1) * meta.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-body-strong">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-body-strong">{meta.total}</span>{" "}
            members
          </p>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(meta.page - 1)}
                  className={
                    meta.page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                let pageNum: number;
                if (meta.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (meta.page <= 3) {
                  pageNum = i + 1;
                } else if (meta.page >= meta.totalPages - 2) {
                  pageNum = meta.totalPages - 4 + i;
                } else {
                  pageNum = meta.page - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={meta.page === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {meta.totalPages > 5 && meta.page < meta.totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    meta.hasMore && handlePageChange(meta.page + 1)
                  }
                  className={
                    meta.page >= meta.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}
