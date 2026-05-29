'use client';

import { useState, useMemo } from 'react';
import { useUrlFilters } from '@src/shared/hooks';
import { DataTable } from '@src/shared/components/data-table';
import { SectionHeader } from '@src/shared/components/section-header';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { useAnnouncementsList } from '@src/features/announcement/hooks/useAnnouncementsList';
import { useDeleteAnnouncement } from '@src/features/announcement/hooks/useDeleteAnnouncement';
import { useAnnouncementColumns } from '@src/features/announcement/hooks/useAnnouncementColumns';
import { CreateAnnouncementDialog } from '@src/features/announcement/components/create-announcement-dialog';
import { EditAnnouncementDialog } from '@src/features/announcement/components/edit-announcement-dialog';
import { DeleteAnnouncementDialog } from '@src/features/announcement/components/delete-announcement-dialog';
import type { Announcement } from '@src/features/announcement/types';

interface AnnouncementsPageProps {
  status?: string;
}

export default function AnnouncementsPage({ status }: AnnouncementsPageProps) {
  const basePath = useMemo(
    () => `/announcement${status ? `/${status.toLowerCase()}` : ''}`,
    [status],
  );
  const { page, setPage } = useUrlFilters({ basePath });

  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  const { announcements, meta, isLoading } = useAnnouncementsList(status, page);
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
      <SectionHeader
        title="Announcements"
        description="Manage announcements for your association"
      >
        <CreateAnnouncementDialog />
      </SectionHeader>

      <DataTableFilters
        fields={[
          {
            type: 'search',
            id: 'search',
            placeholder: 'Search announcements...',
          },
        ]}
        onFilterChange={() => {}}
      />

      <DataTable loading={isLoading} data={announcements} columns={columns} />

      <DataTablePagination meta={meta} onPageChange={setPage} label="announcements" />

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
