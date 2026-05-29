'use client';

import { CheckSquare, Square } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';

interface PaneHeaderProps {
  title: string;
  count: number;
  total: number;
  onToggleAll: () => void;
}

export function PaneHeader({ title, count, total, onToggleAll }: PaneHeaderProps) {
  const allSelected = count === total && total > 0;
  return (
    <div className="flex items-center gap-3 pb-2 border-b text-xs font-medium">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleAll}
        className="hover:text-ink text-muted-foreground h-auto w-auto"
      >
        {allSelected ? (
          <CheckSquare className="h-4 w-4 text-primary" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </Button>
      <span className="text-muted-foreground">{title}</span>
      <span className="text-ink font-semibold">{total}</span>
      <span className="ml-auto text-muted-foreground">Action</span>
    </div>
  );
}
