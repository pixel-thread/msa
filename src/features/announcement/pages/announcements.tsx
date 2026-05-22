"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataTable } from "@src/shared/components/data-table";
import { useAnnouncementsList } from "@src/features/announcement/hooks/useAnnouncementsList";
import { useDeleteAnnouncement } from "@src/features/announcement/hooks/useDeleteAnnouncement";
import { useAnnouncementColumns } from "@src/features/announcement/hooks/useAnnouncementColumns";
import { CreateAnnouncementDialog } from "@src/features/announcement/components/create-announcement-dialog";
import { EditAnnouncementDialog } from "@src/features/announcement/components/edit-announcement-dialog";
import { DeleteAnnouncementDialog } from "@src/features/announcement/components/delete-announcement-dialog";
import type { Announcement } from "@src/features/announcement/types";
import { cn } from "@src/shared/lib/utils";

const TABS = [
  { label: "Published", href: "/announcement" },
  { label: "Drafts", href: "/announcement/draft" },
  { label: "Archive", href: "/announcement/archive" },
] as const;

interface AnnouncementsPageProps {
  status?: string;
}

export default function AnnouncementsPage({ status }: AnnouncementsPageProps) {
  const pathname = usePathname();
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] =
    useState<Announcement | null>(null);

  const { announcements, isLoading } = useAnnouncementsList(status);
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

      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              pathname === tab.href
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
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
