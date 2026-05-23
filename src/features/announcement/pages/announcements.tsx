"use client";

import { useState, useCallback } from "react";
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
            Announcements
          </h1>
          <p className="mt-1 text-base text-body">
            Manage announcements for your association
          </p>
        </div>
        <CreateAnnouncementDialog />
      </div>

      <DataTable loading={isLoading} data={announcements} columns={columns} />

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
            announcements
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
