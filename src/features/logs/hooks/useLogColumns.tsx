import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import { formatDate } from "@src/shared/utils";
import type { LogEntry } from "../types";

const levelBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  error: "destructive",
  warn: "secondary",
  info: "default",
  debug: "outline",
};

function getLevelBadgeVariant(level: string) {
  return levelBadgeVariant[level] ?? "outline";
}

interface UseLogColumnsOptions {
  onViewDetails?: (entry: LogEntry) => void;
}

export function useLogColumns({ onViewDetails }: UseLogColumnsOptions = {}) {
  const columns: ColumnDef<LogEntry>[] = [
    {
      accessorKey: "type",
      header: "Level",
      cell: ({ row }) => (
        <Badge variant={getLevelBadgeVariant(row.original.type)}>
          {row.original.type.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <span className="text-sm truncate max-w-[400px] block">
          {row.original.message}
        </span>
      ),
    },
    {
      accessorKey: "isBackend",
      header: "Source",
      cell: ({ row }) => (
        <Badge variant={row.original.isBackend ? "default" : "secondary"}>
          {row.original.isBackend ? "Backend" : "Client"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "details",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => onViewDetails?.(row.original)}
        >
          View
        </Button>
      ),
    },
  ];

  return { columns };
}
