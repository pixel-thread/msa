import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@src/shared/components/ui/dialog";
import { Badge } from "@src/shared/components/ui/badge";
import { formatDate } from "@src/shared/utils";
import type { LogEntry } from "../types";

interface LogDetailsDialogProps {
  entry: LogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const levelBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  error: "destructive",
  warn: "secondary",
  info: "default",
  debug: "outline",
};

export function LogDetailsDialog({
  entry,
  open,
  onOpenChange,
}: LogDetailsDialogProps) {
  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Details</DialogTitle>
          <DialogDescription>Full log entry information</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Level:</span>
            <Badge variant={levelBadgeVariant[entry.type] ?? "outline"}>
              {entry.type.toUpperCase()}
            </Badge>
          </div>

          <div>
            <span className="text-sm font-medium">Message:</span>
            <p className="mt-1 text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
              {entry.message}
            </p>
          </div>

          <div>
            <span className="text-sm font-medium">Source:</span>
            <p className="mt-1 text-sm">
              {entry.isBackend ? "Backend" : "Client"}
            </p>
          </div>

          <div>
            <span className="text-sm font-medium">Timestamp:</span>
            <p className="mt-1 text-sm">
              {formatDate(entry.createdAt)}
            </p>
          </div>

          <div>
            <span className="text-sm font-medium">ID:</span>
            <p className="mt-1 text-sm font-mono text-muted-foreground">
              {entry.id}
            </p>
          </div>

          {entry.content && Object.keys(entry.content).length > 0 && (
            <div>
              <span className="text-sm font-medium">Context / Metadata:</span>
              <pre className="mt-1 bg-muted p-4 text-xs overflow-x-auto whitespace-pre-wrap rounded-md">
                {JSON.stringify(entry.content, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
