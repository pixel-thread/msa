"use client";

import { useState } from "react";
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
import { Button } from "@src/shared/components/ui/button";
import { Check, X } from "lucide-react";
import { useMembers } from "../hooks/useMembers";
import { usePendingMemberColumns } from "../hooks/usePendingMemberColumns";
import { ColumnDef } from "@tanstack/react-table";
import { Members } from "../types";
import { ApproveMemberDialog } from "../components/approve-member-dialog";
import { useRejectMember } from "../hooks/useRejectMember";

export function PendingMembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const { columns: pendingColumns } = usePendingMemberColumns();
  const [selectedMember, setSelectedMember] = useState<Members | null>(null);
  const rejectMember = useRejectMember();

  const {
    members: pendingMembers,
    meta,
    isLoading,
  } = useMembers({
    page: currentPage,
    status: "PENDING",
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/members/pending?${params.toString()}`);
  };

  const handleAccept = (member: Members) => {
    setSelectedMember(member);
  };

  const handleReject = (memberId: string) => {
    rejectMember.mutate({ memberId });
  };

  const columns: ColumnDef<Members>[] = [
    ...pendingColumns,
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleAccept(member)}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReject(member.id)}
              disabled={rejectMember.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Pending Members
          </h1>
          <p className="mt-1 text-base text-body">
            Review and accept new member applications
          </p>
        </div>
      </div>

      <DataTable
        loading={isLoading}
        data={pendingMembers ?? []}
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
            <span className="font-medium text-body-strong">{meta.total}</span>{" "}
            pending members
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
                  onClick={() => handlePageChange(meta.page + 1)}
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

      <ApproveMemberDialog
        member={selectedMember}
        open={!!selectedMember}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMember(null);
          }
        }}
      />
    </>
  );
}
