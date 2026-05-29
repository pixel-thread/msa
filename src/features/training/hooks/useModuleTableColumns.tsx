import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@src/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@src/shared/components/ui/dropdown-menu';
import { Button } from '@src/shared/components/ui/button';
import { MoreHorizontal, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import type { TrainingModuleListItem } from '../types';
import Link from 'next/link';

export const useModuleTableColumns = (options: {
  onManage: (module: TrainingModuleListItem) => void;
  onToggleActive: (module: TrainingModuleListItem) => void;
}): { columns: ColumnDef<TrainingModuleListItem>[] } => {
  const { onManage, onToggleActive } = options;

  const columns: ColumnDef<TrainingModuleListItem>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => {
        const mod = row.original;
        return (
          <Link href={`/training/${mod.id}`} className="flex flex-col max-w-md">
            <span className="text-sm font-semibold text-ink">{mod.title}</span>
            {mod.description && (
              <span className="text-xs text-muted-foreground truncate">{mod.description}</span>
            )}
          </Link>
        );
      },
    },
    {
      accessorKey: 'durationMinutes',
      header: 'Duration',
      cell: ({ row }) => {
        const duration = row.original.durationMinutes;
        return <span className="text-sm text-body">{duration ? `${duration} mins` : 'N/A'}</span>;
      },
    },
    {
      accessorKey: 'requiredForRoles',
      header: 'Required Roles',
      cell: ({ row }) => {
        const roles = row.original.requiredForRoles || [];
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge key={role} variant="secondary" className="text-[10px]">
                {role}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? 'default' : 'destructive'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }) => <span className="text-sm text-body">v{row.original.version}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const mod = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onManage(mod)}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Module
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(mod)}>
                {mod.isActive ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4 text-destructive" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4 text-primary" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return { columns };
};
