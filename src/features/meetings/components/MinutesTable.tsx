"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@src/shared/components/ui/table";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import { Pencil, Trash2, ClipboardList } from "lucide-react";

import type { MeetingMinute } from "@src/features/meetings/hooks/useMeetingMinutes";

interface ActionItem {
  assigneeId?: string;
  task: string;
  dueDate?: string;
}

interface MinutesTableProps {
  minutes: MeetingMinute[];
  isLoading: boolean;
  onEdit: (minute: MeetingMinute) => void;
  onDelete: (minute: MeetingMinute) => void;
}

export function MinutesTable({ minutes, isLoading, onEdit, onDelete }: MinutesTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading minutes...</p>
      </div>
    );
  }

  if (minutes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ClipboardList className="h-12 w-12 text-muted mb-4" />
        <p className="text-base text-body">No minutes recorded yet</p>
        <p className="text-sm text-muted mt-1">
          Add meeting minutes to document decisions and action items
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">Agenda Point</TableHead>
          <TableHead>Decision</TableHead>
          <TableHead className="w-[150px]">Action Items</TableHead>
          <TableHead className="w-[120px]">Recorded</TableHead>
          <TableHead className="w-[100px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {minutes.map((minute) => (
          <TableRow key={minute.id}>
            <TableCell>
              <span className="text-sm font-medium">{minute.agendaPoint}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-body line-clamp-2">
                {minute.decision}
              </span>
            </TableCell>
            <TableCell>
              {minute.actionItems && minute.actionItems.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {minute.actionItems.slice(0, 2).map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs justify-start">
                      {item.task}
                    </Badge>
                  ))}
                  {minute.actionItems.length > 2 && (
                    <span className="text-xs text-muted">
                      +{minute.actionItems.length - 2} more
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted">None</span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted">
                {formatDate(minute.recordedAt)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(minute)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => onDelete(minute)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
