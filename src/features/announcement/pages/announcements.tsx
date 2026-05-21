"use client";

import { useState } from "react";
import { DataTable } from "@src/shared/components/data-table";
import { useAnnouncementsList } from "@src/features/announcement/hooks/useAnnouncementsList";
import { useDeleteAnnouncement } from "@src/features/announcement/hooks/useDeleteAnnouncement";
import { useAnnouncementColumns } from "@src/features/announcement/hooks/useAnnouncementColumns";
import { CreateAnnouncementDialog } from "@src/features/announcement/components/create-announcement-dialog";
import { EditAnnouncementDialog } from "@src/features/announcement/components/edit-announcement-dialog";
import { DeleteAnnouncementDialog } from "@src/features/announcement/components/delete-announcement-dialog";
import type { Announcement } from "@src/features/announcement/types";

export default function AnnouncementsPage() {
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  const { announcements, isLoading } = useAnnouncementsList();
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
