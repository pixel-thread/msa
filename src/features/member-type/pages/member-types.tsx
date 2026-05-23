"use client";

import { useState } from "react";
import { DataTable } from "@src/shared/components/data-table";
import {
  DataTableFilters,
} from "@src/shared/components/data-table-filters";
import { useMemberTypesList } from "@src/features/member-type/hooks/useMemberTypesList";
import { useDeleteMemberType } from "@src/features/member-type/hooks/useDeleteMemberType";
import { useMemberTypeColumns } from "@src/features/member-type/hooks/useMemberTypeColumns";
import { CreateMemberTypeDialog } from "@src/features/member-type/components/create-member-type-dialog";
import { EditMemberTypeDialog } from "@src/features/member-type/components/edit-member-type-dialog";
import { DeleteMemberTypeDialog } from "@src/features/member-type/components/delete-member-type-dialog";

interface MemberType {
  id: string;
  level: number;
  description: string | null;
  _count: {
    users: number;
    subscriptionPlans: number;
  };
}

export default function MemberTypesPage() {
  const [editingMemberType, setEditingMemberType] = useState<MemberType | null>(null);
  const [deletingMemberType, setDeletingMemberType] = useState<MemberType | null>(null);

  const { memberTypes, isLoading } = useMemberTypesList();
  const deleteMemberType = useDeleteMemberType();

  const { columns } = useMemberTypeColumns({
    onEdit: setEditingMemberType,
    onDelete: setDeletingMemberType,
  });

  const handleDeleteConfirm = () => {
    if (deletingMemberType) {
      deleteMemberType.mutate(deletingMemberType.id, {
        onSuccess: () => setDeletingMemberType(null),
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Member Types
          </h1>
          <p className="mt-1 text-base text-body">
            Manage member type levels for your association
          </p>
        </div>
        <CreateMemberTypeDialog />
      </div>

      <DataTableFilters
        fields={[
          {
            type: "search",
            id: "search",
            placeholder: "Search member types...",
          },
        ]}
        onFilterChange={() => {}}
      />

      <DataTable loading={isLoading} data={memberTypes} columns={columns} />

      <EditMemberTypeDialog
        memberType={editingMemberType}
        open={!!editingMemberType}
        onOpenChange={(open) => {
          if (!open) setEditingMemberType(null);
        }}
      />

      <DeleteMemberTypeDialog
        memberType={deletingMemberType}
        open={!!deletingMemberType}
        onOpenChange={(open) => {
          if (!open) setDeletingMemberType(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMemberType.isPending}
      />
    </>
  );
}
