import { Skeleton } from '@src/shared/components/ui/skeleton';
import { TableCell, TableRow } from '@src/shared/components/ui/table';

type TableSkeletonProps = {
  columns: number;
  rows?: number;
};

function TableSkeleton({ columns, rows = 10 }: TableSkeletonProps) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <TableRow key={rowIndex}>
      {Array.from({ length: columns }).map((_, colIndex) => (
        <TableCell key={colIndex}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export { TableSkeleton };
