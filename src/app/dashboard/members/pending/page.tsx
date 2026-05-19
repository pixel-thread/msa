"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { DataTable } from "@src/shared/components/data-table";
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
import { Button } from "@src/shared/components/ui/button";
import { usePendingMembers } from "@src/features/members/hooks/usePendingMembers";
import { useUpdateMemberStatus } from "@src/features/members/hooks/useUpdateMemberStatus";
import { useMemberTableColumns } from "@src/features/members/hooks/useMemberTableColumns";
import { Badge } from "@src/shared/components/ui/badge";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import { formatDate } from "@src/shared/utils";
import Link from "next/link";
import { Check, X } from "lucide-react";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function PendingMembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const [search, setSearch] = useState("");

  const { pendingMembers, meta, isLoading } = usePendingMembers({ page: currentPage });
  const updateStatus = useUpdateMemberStatus();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/dashboard/members/pending?${params.toString()}`);
  };

  const handleAccept = (memberId: string) => {
    updateStatus.mutate({
      memberId,
      status: "ACTIVE",
    });
  };

  const handleReject = (memberId: string) => {
    updateStatus.mutate({
      memberId,
      status: "INACTIVE",
    });
  };

  const filteredMembers = search
    ? pendingMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase()),
      )
    : pendingMembers;

  const columns = [
    {
      accessorKey: "name",
      header: "Member",
      cell: ({ row }: { row: { original: (typeof pendingMembers)[0] } }) => {
        const member = row.original;
        return (
          <Link
            className="flex items-center gap-3 text-left hover:underline"
            href={`/dashboard/members/${member.id}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-muted">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{member.name}</span>
              {member.membershipNumber && (
                <span className="text-xs text-muted-foreground">
                  {member.membershipNumber}
                </span>
              )}
            </div>
          </Link>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }: { row: { original: (typeof pendingMembers)[0] } }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: () => <Badge variant="outline">PENDING</Badge>,
    },
    {
      accessorKey: "createdAt",
      header: "Requested",
      cell: ({ row }: { row: { original: (typeof pendingMembers)[0] } }) => (
        <span className="text-right text-muted-foreground text-sm block ml-auto">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: (typeof pendingMembers)[0] } }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleAccept(member.id)}
              disabled={updateStatus.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReject(member.id)}
              disabled={updateStatus.isPending}
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

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search pending members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm h-11 rounded-md border-hairline bg-canvas text-ink placeholder:text-muted focus-visible:border-primary"
        />
      </div>

      <DataTable loading={isLoading} data={filteredMembers} columns={columns} />

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
    </>
  );
}
