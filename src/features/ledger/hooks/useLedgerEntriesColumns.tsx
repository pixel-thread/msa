import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import { formatDate } from "@src/shared/utils/format";
import type { LedgerEntryResponse } from "./useLedgerEntries";

interface UseLedgerEntriesColumnsOptions {
  onViewDetails?: (entry: LedgerEntryResponse) => void;
  onApprove?: (entry: LedgerEntryResponse) => void;
}

const statusBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  APPROVED: "default",
  PENDING: "secondary",
  REJECTED: "destructive",
};

export function useLedgerEntriesColumns({
  onViewDetails,
  onApprove,
}: UseLedgerEntriesColumnsOptions = {}) {
  const columns: ColumnDef<LedgerEntryResponse>[] = [
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm text-ink max-w-[300px] block truncate">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: "approvalStatus",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={statusBadgeVariant[row.original.approvalStatus] ?? "outline"}
        >
          {row.original.approvalStatus}
        </Badge>
      ),
    },
    {
      accessorKey: "lines",
      header: "Lines",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lines.length}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onViewDetails?.(row.original)}
          >
            View
          </Button>
          {row.original.approvalStatus === "PENDING" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => onApprove?.(row.original)}
            >
              Approve
            </Button>
          )}
        </div>
      ),
    },
  ];

  return { columns };
}
