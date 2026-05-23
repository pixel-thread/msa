"use client";

import { useCallback, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DataTable } from "@src/shared/components/data-table";
import {
  DataTableFilters,
} from "@src/shared/components/data-table-filters";
import { Button } from "@src/shared/components/ui/button";
import { Plus } from "lucide-react";
import { useMeetings } from "@src/features/meetings/hooks";
import { useMeetingTableColumns } from "@src/features/meetings/hooks/useMeetingTableColumns";
import { CreateMeetingDialog } from "@src/features/meetings/components/CreateMeetingDialog";
import { DataTablePagination } from "@src/shared/components/data-table-pagination";

export default function MeetingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  const [createOpen, setCreateOpen] = useState(false);

  const { meetings, meta, isLoading } = useMeetings({
    page: currentPage,
  });
  const { columns } = useMeetingTableColumns();

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
        <Button onClick={() => setCreateOpen(true)} variant={"default"}>
          <Plus className="mr-2 h-4 w-4" />
          Create Meeting
        </Button>
      </div>

      <CreateMeetingDialog open={createOpen} onOpenChange={setCreateOpen} />

      <DataTableFilters
        fields={[
          {
            type: "search",
            id: "search",
            placeholder: "Search meetings...",
          },
        ]}
        onFilterChange={() => {}}
      />

      <DataTable
        loading={isLoading}
        data={meetings}
        columns={columns}
      />

      <DataTablePagination meta={meta} onPageChange={handlePageChange} />
    </>
  );
}
