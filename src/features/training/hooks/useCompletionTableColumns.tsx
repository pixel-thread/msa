import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@src/shared/utils";
import { LinkIcon } from "lucide-react";
import type { TrainingCompletionItem } from "../types";

// Let's check if the date util is imported correctly.
// Let's verify where formatDate is imported from in useMeetingTableColumns.tsx:
// It was: import { formatDate } from "@src/shared/utils";
// Let's use "@src/shared/utils" to be safe.

export const useCompletionTableColumns = (): { columns: ColumnDef<TrainingCompletionItem>[] } => {
  const columns: ColumnDef<TrainingCompletionItem>[] = [
    {
      accessorKey: "user.name",
      header: "Member",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">{user?.name || "Unknown User"}</span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "module.title",
      header: "Training Module",
      cell: ({ row }) => {
        const module = row.original.module;
        return <span className="text-sm font-medium text-ink">{module?.title || "Unknown Module"}</span>;
      },
    },
    {
      accessorKey: "scorePercent",
      header: "Score",
      cell: ({ row }) => {
        const score = row.original.scorePercent;
        return (
          <span className="text-sm text-body">
            {score !== null && score !== undefined ? `${score}%` : "N/A"}
          </span>
        );
      },
    },
    {
      accessorKey: "completedAt",
      header: "Completed At",
      cell: ({ row }) => {
        const completedAt = row.original.completedAt;
        return (
          <span className="text-sm text-body">
            {completedAt ? formatDate(completedAt) : "N/A"}
          </span>
        );
      },
    },
    {
      accessorKey: "certificateUrl",
      header: "Certificate",
      cell: ({ row }) => {
        const url = row.original.certificateUrl;
        if (!url) return <span className="text-xs text-muted-foreground">None</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            View
          </a>
        );
      },
    },
  ];

  return { columns };
};
