import { Meeting } from "@prisma/client";
import { formatDate } from "@src/shared/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@src/shared/components/ui/badge";

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    SCHEDULED: "default",
    COMPLETED: "secondary",
    CANCELLED: "destructive",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};

export const useMeetingTableColumns = (): { columns: ColumnDef<Meeting>[] } => {
  const columns: ColumnDef<Meeting>[] = [
    {
      accessorKey: "title",
      header: "Meeting Title",
      cell: ({ row, table }) => {
        const router = table.options.meta?.router as ReturnType<typeof import("next/navigation").useRouter> | undefined;
        return (
          <button
            className="text-left font-medium hover:underline text-primary"
            onClick={() => router?.push(`/dashboard/meetings/${row.original.id}`)}
          >
            {row.original.title}
          </button>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Meeting Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Meeting Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "scheduledAt",
      header: "Meeting date",
      cell: ({ row }) => formatDate(row.original.scheduledAt),
    },
    {
      accessorKey: "venue",
      header: "Venue",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.venue || "-"}
        </span>
      ),
    },
  ];

  return { columns };
};
