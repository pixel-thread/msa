'use client';

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/shared/components/ui/table';
import { TableSkeleton } from '@src/shared/components/ui/table-skeleton';
import { Card } from '@components/ui/card';
import { PAGE_SIZE } from '@src/shared/constants';

type DataTableProps<TData> = {
  loading?: boolean;
  data: TData[];
  columns: ColumnDef<TData>[];
  meta?: Record<string, unknown>;
};

export function DataTable<TData>({ loading = false, data, columns, meta }: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
  });

  return (
    <Card className="overflow-visible p-4">
      <div className="w-full min-w-0 overflow-x-auto border">
        <Table>
          <TableHeader className="bg-primary/80 text-black">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="text-inherit">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-primary-foreground hover:text-inherit">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeleton columns={columns.length} rows={PAGE_SIZE} />
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
