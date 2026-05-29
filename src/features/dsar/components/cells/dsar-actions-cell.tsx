'use client';

import { Button } from '@src/shared/components/ui/button';
import { Eye, Pen, Trash2, UserPlus } from 'lucide-react';
import type { DsarTicketRecord } from '../../types';

interface DsarActionsCellProps {
  record: DsarTicketRecord;
  onViewDetail: (record: DsarTicketRecord) => void;
  onRespond: (record: DsarTicketRecord) => void;
  onAssign: (record: DsarTicketRecord) => void;
  onDelete: (record: DsarTicketRecord) => void;
}

export function DsarActionsCell({
  record,
  onViewDetail,
  onRespond,
  onAssign,
  onDelete,
}: DsarActionsCellProps) {
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="ghost" onClick={() => onViewDetail(record)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onRespond(record)}>
        <Pen className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onAssign(record)}>
        <UserPlus className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onDelete(record)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
