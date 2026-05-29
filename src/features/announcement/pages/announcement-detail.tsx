'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAnnouncement } from '@src/features/announcement/hooks/useAnnouncement';
import { useDeleteAnnouncement } from '@src/features/announcement/hooks/useDeleteAnnouncement';
import { useMarkAnnouncementRead } from '@src/features/announcement/hooks/useMarkAnnouncementRead';
import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import { Separator } from '@src/shared/components/ui/separator';
import { formatDate } from '@src/shared/utils';
import { ArrowLeft, Pencil, Trash2, Eye, Pin, User, Calendar, Flag, BarChart3 } from 'lucide-react';
import { EditAnnouncementDialog } from '@src/features/announcement/components/edit-announcement-dialog';
import { DeleteAnnouncementDialog } from '@src/features/announcement/components/delete-announcement-dialog';

const priorityVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  LOW: 'outline',
  NORMAL: 'default',
  HIGH: 'secondary',
  URGENT: 'destructive',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  DRAFT: 'outline',
  PUBLISHED: 'default',
  SCHEDULED: 'secondary',
  ARCHIVED: 'outline',
};

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const announcementId = params.announcementId as string;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { announcement, isLoading, error } = useAnnouncement(announcementId);
  const markAsRead = useMarkAnnouncementRead(announcementId);
  const deleteAnnouncement = useDeleteAnnouncement();

  const handleDeleteConfirm = () => {
    deleteAnnouncement.mutate(announcementId, {
      onSuccess: () => router.push('/announcement'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading announcement...</p>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-lg text-body">Announcement not found</p>
        <Button
          variant="outline"
          className="mt-4 h-11 border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title={announcement.title}
        titleBadges={
          <>
            {announcement.isPinned && (
              <span title="Pinned">
                <Pin className="h-5 w-5 text-amber-500" />
              </span>
            )}
            <Badge variant={statusVariants[announcement.status] || 'outline'}>
              {announcement.status}
            </Badge>
            <Badge variant={priorityVariants[announcement.priority] || 'outline'}>
              {announcement.priority}
            </Badge>
          </>
        }
        description="Announcement details"
      >
        <Button
          variant="outline"
          onClick={() => markAsRead.mutate()}
          disabled={markAsRead.isPending}
          className="h-11 border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
        >
          <Eye className="mr-2 h-4 w-4" />
          {markAsRead.isPending ? 'Marking...' : 'Mark as Read'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setDeleteOpen(true)}
          className="h-11 border-hairline bg-canvas px-5 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Button
          onClick={() => setEditOpen(true)}
          className="h-11 bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-active"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </SectionHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className=" border-hairline bg-surface-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcement.imageUrl && (
              <div className="mb-6 overflow-hidden">
                <img
                  src={announcement.imageUrl}
                  alt={announcement.title}
                  className="w-full max-h-80 object-cover"
                />
              </div>
            )}
            {announcement.summary && (
              <>
                <p className="text-sm font-medium text-ink">{announcement.summary}</p>
                <Separator className="my-4 bg-hairline" />
              </>
            )}
            <div className="whitespace-pre-wrap text-sm text-ink">{announcement.content}</div>
          </CardContent>
        </Card>

        <Card className=" border-hairline bg-surface-card h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Author</p>
                  <p className="text-sm text-ink">{announcement.author.name || 'Unknown'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Published</p>
                  <p className="text-sm text-ink">
                    {announcement.publishedAt
                      ? formatDate(announcement.publishedAt)
                      : 'Not published'}
                  </p>
                </div>
              </div>

              {announcement.expiresAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Expires</p>
                    <p className="text-sm text-ink">{formatDate(announcement.expiresAt)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Flag className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Priority</p>
                  <Badge
                    variant={priorityVariants[announcement.priority] || 'outline'}
                    className="mt-0.5"
                  >
                    {announcement.priority}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-hairline" />

              <div className="flex items-start gap-3">
                <BarChart3 className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Read by</p>
                  <p className="text-sm text-ink">
                    {announcement._count.readReceipts} member
                    {announcement._count.readReceipts !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {announcement.readReceipts && announcement.readReceipts.length > 0 && (
        <Card className=" border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Read Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcement.readReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between border border-hairline p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{receipt.user.name || 'Unknown'}</p>
                    {receipt.user.membershipNumber && (
                      <p className="text-xs text-muted-foreground">
                        #{receipt.user.membershipNumber}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(receipt.readAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <EditAnnouncementDialog
        announcement={announcement}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteAnnouncementDialog
        announcement={announcement}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteAnnouncement.isPending}
      />
    </>
  );
}
