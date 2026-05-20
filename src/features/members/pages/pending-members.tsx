"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { DataTable } from "@src/shared/components/data-table";
import { useMembers } from "../hooks/useMembers";
import { usePendingMemberColumns } from "../hooks/usePendingMemberColumns";
import { MemberReviewDialog } from "../components/member-review-dialog";
import { useRejectMember } from "../hooks/useRejectMember";
import { MembersPagination } from "../components/members-pagination";
import { MemberListItem } from "../types";

export function PendingMembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const [selectedMember, setSelectedMember] = useState<MemberListItem | null>(
    null,
  );
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

  const { columns } = usePendingMemberColumns({
    onAccept: setSelectedMember,
    onReject: (memberId: string) => rejectMember.mutate({ memberId }),
    isRejecting: rejectMember.isPending,
  });

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

      {meta && (
        <MembersPagination
          meta={meta}
          onPageChange={handlePageChange}
          label="pending members"
        />
      )}

      <MemberReviewDialog
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
