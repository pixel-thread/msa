"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DataTable } from "@src/shared/components/data-table";
import { DataTablePagination } from "@src/shared/components/data-table-pagination";
import { useAnnouncementsList } from "@src/features/announcement/hooks/useAnnouncementsList";
import { useDeleteAnnouncement } from "@src/features/announcement/hooks/useDeleteAnnouncement";
import { useAnnouncementColumns } from "@src/features/announcement/hooks/useAnnouncementColumns";
import { CreateAnnouncementDialog } from "@src/features/announcement/components/create-announcement-dialog";
import { EditAnnouncementDialog } from "@src/features/announcement/components/edit-announcement-dialog";
import { DeleteAnnouncementDialog } from "@src/features/announcement/components/delete-announcement-dialog";
import type { Announcement } from "@src/features/announcement/types";

interface AnnouncementsPageProps {
  status?: string;
}

export default function AnnouncementsPage({ status }: AnnouncementsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] =
    useState<Announcement | null>(null);

  const { announcements, meta, isLoading } = useAnnouncementsList(status, currentPage);
  const deleteAnnouncement = useDeleteAnnouncement();

  const { columns } = useAnnouncementColumns({
    onEdit: setEditingAnnouncement,
    onDelete: setDeletingAnnouncement,
  });

  const handleDeleteConfirm = () => {
    if (deletingAnnouncement) {
      deleteAnnouncement.mutate(deletingAnnouncement.id, {
        onSuccess: () => setDeletingAnnouncement(null),
      });
    }
  };

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.push(`/announcement${status ? `/${status.toLowerCase()}` : ""}?${params.toString()}`);
    },
    [router, searchParams, status],
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Announcements
          </h1>
          <p className="mt-1 text-base text-body">
            Manage announcements for your association
          </p>
        </div>
        <CreateAnnouncementDialog />
      </div>

      <DataTable loading={isLoading} data={announcements} columns={columns} />

      <DataTablePagination
        meta={meta}
        onPageChange={handlePageChange}
        label="announcements"
      />

      <EditAnnouncementDialog
        announcement={editingAnnouncement}
        open={!!editingAnnouncement}
        onOpenChange={(open) => {
          if (!open) setEditingAnnouncement(null);
        }}
      />

      <DeleteAnnouncementDialog
        announcement={deletingAnnouncement}
        open={!!deletingAnnouncement}
        onOpenChange={(open) => {
          if (!open) setDeletingAnnouncement(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteAnnouncement.isPending}
      />
    </>
  );
}
