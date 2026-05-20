import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import type { TrainingModuleListItem } from "../types";

export const usePortalModuleTableColumns = (options: {
  completedModuleIds: Set<string>;
  onView: (module: TrainingModuleListItem) => void;
}): { columns: ColumnDef<TrainingModuleListItem>[] } => {
  const { completedModuleIds, onView } = options;

  const columns: ColumnDef<TrainingModuleListItem>[] = [
    {
      accessorKey: "title",
      header: "Training Course",
      cell: ({ row }) => {
        const module = row.original;
        return (
          <div className="flex flex-col max-w-md">
            <span className="text-sm font-semibold text-ink">{module.title}</span>
            {module.description && (
              <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{module.description}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "durationMinutes",
      header: "Duration",
      cell: ({ row }) => {
        const duration = row.original.durationMinutes;
        return (
          <span className="inline-flex items-center gap-1 text-sm text-body">
            <Clock className="h-3.5 w-3.5 text-muted" />
            {duration ? `${duration} mins` : "N/A"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const module = row.original;
        const isCompleted = completedModuleIds.has(module.id);
        return isCompleted ? (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1 shrink-0 w-fit">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0 w-fit">
            Assigned
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const module = row.original;
        const isCompleted = completedModuleIds.has(module.id);
        return (
          <div className="text-right">
            <Button
              onClick={() => onView(module)}
              size="sm"
              variant={isCompleted ? "outline" : "default"}
              className="h-8 text-xs font-semibold px-4 rounded-full"
            >
              {isCompleted ? "Review" : "Start"}
            </Button>
          </div>
        );
      },
    },
  ];

  return { columns };
};
