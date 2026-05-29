'use client';

import { Button } from '@src/shared/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { ConsentRecord } from '../../types/consent.types';

interface ConsentActionsCellProps {
  record: ConsentRecord;
  onViewDetail: (record: ConsentRecord) => void;
  onEdit: (record: ConsentRecord) => void;
  onDelete: (record: ConsentRecord) => void;
}

export function ConsentActionsCell({
  record,
  onViewDetail,
  onEdit,
  onDelete,
}: ConsentActionsCellProps) {
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="ghost" onClick={() => onViewDetail(record)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onEdit(record)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onDelete(record)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
