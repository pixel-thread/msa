'use client';

import { Button } from '@src/shared/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import type { ComplianceRecord } from '../../types/compliance.types';

interface ComplianceActionsCellProps {
  record: ComplianceRecord;
  onViewDetail: (record: ComplianceRecord) => void;
  onDelete: (record: ComplianceRecord) => void;
}

export function ComplianceActionsCell({
  record,
  onViewDetail,
  onDelete,
}: ComplianceActionsCellProps) {
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="ghost" onClick={() => onViewDetail(record)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onDelete(record)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
