import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import type { AuditLogEntry } from '../types';

interface AuditLogDetailsDialogProps {
  entry: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailsDialog({ entry, open, onOpenChange }: AuditLogDetailsDialogProps) {
  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Details</DialogTitle>
          <DialogDescription>Old and new values for this audit log entry</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {entry.oldValues && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-red-600">Old Values</h4>
              <pre className=" bg-red-50 p-4 text-xs overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(entry.oldValues, null, 2)}
              </pre>
            </div>
          )}

          {entry.newValues && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-green-600">New Values</h4>
              <pre className=" bg-green-50 p-4 text-xs overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(entry.newValues, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
