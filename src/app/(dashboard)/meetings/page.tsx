"use client";

import { useCallback, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DataTable } from "@src/shared/components/data-table";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@src/shared/components/ui/pagination";
import { Plus, Search } from "lucide-react";
import { useMeetings } from "@src/features/meetings/hooks";
import { useMeetingTableColumns } from "@src/features/meetings/hooks/useMeetingTableColumns";
import { CreateMeetingDialog } from "@src/features/meetings/components/CreateMeetingDialog";

export default function MeetingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { meetings, meta, isLoading } = useMeetings({ page: currentPage });
  const { columns } = useMeetingTableColumns();

  const filteredMeetings = search
    ? meetings.filter(
        (m) =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.venue?.toLowerCase().includes(search.toLowerCase()),
      )
    : meetings;

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.push(`/meetings?${params.toString()}`);
    },
    [router, searchParams],
  );

  const getPageNumbers = (page: number, totalPages: number) => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Meetings
          </h1>
          <p className="mt-1 text-base text-body">
            Manage and view all association meetings
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-active"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Meeting
        </Button>
      </div>

      <CreateMeetingDialog open={createOpen} onOpenChange={setCreateOpen} />

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (currentPage !== 1) handlePageChange(1);
            }}
            className="h-11 rounded-md border-hairline bg-canvas pl-10 text-ink placeholder:text-muted-foreground focus-visible:border-primary"
          />
        </div>
      </div>

      <DataTable
        loading={isLoading}
        data={filteredMeetings}
        columns={columns}
      />

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
            <span className="font-medium text-body-strong">
              {meta.total}
            </span>{" "}
            meetings
          </p>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPageNumbers(currentPage, meta.totalPages).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {meta.totalPages > 5 && currentPage < meta.totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage >= meta.totalPages
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
