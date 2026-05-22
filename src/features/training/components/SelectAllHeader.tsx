"use client";

import { CheckSquare, Square } from "lucide-react";

interface SelectAllHeaderProps {
  count: number;
  total: number;
  onToggleAll: () => void;
}

export function SelectAllHeader({
  count,
  total,
  onToggleAll,
}: SelectAllHeaderProps) {
  const allSelected = count === total && total > 0;
  return (
    <div className="flex items-center gap-3 px-3 py-1 border-b text-xs text-muted-foreground font-medium">
      <button
        onClick={onToggleAll}
        className="hover:text-ink text-muted-foreground flex items-center"
      >
        {allSelected ? (
          <CheckSquare className="h-4 w-4 text-primary" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </button>
      <span className="flex-1">Select All / User Details</span>
      <span>Action</span>
    </div>
  );
}
