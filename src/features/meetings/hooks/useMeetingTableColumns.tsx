import { Meeting } from "@prisma/client";
import { formatDate } from "@src/shared/utils";
import { ColumnDef } from "@tanstack/react-table";

const baseColumns: ColumnDef<Meeting>[] = [
  {
    accessorKey: "title",
    header: "Meeting Title",
  },
  {
    accessorKey: "type",
    header: "Meeting Type",
  },
  {
    accessorKey: "status",
    header: "Meeting Status",
  },
  {
    accessorKey: "scheduledAt",
    header: "Meeting date",
    cell: ({ row }) => formatDate(row.original.scheduledAt),
  },
  {
    accessorKey: "venue",
    header: "Venue",
  },
];

export const useMeetingTableColumns = (): { columns: ColumnDef<Meeting>[] } => {
  const column: ColumnDef<Meeting>[] = [...baseColumns];
  return { columns: column };
};
