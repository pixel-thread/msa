'use client';

import { Button } from '@src/shared/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { Announcement } from '@src/features/announcement/types';

interface AnnouncementActionsCellProps {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
}

export function AnnouncementActionsCell({
  announcement,
  onEdit,
  onDelete,
}: AnnouncementActionsCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="ghost" onClick={() => onEdit(announcement)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onDelete(announcement)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
