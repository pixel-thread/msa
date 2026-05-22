"use client";

import { CheckSquare, Square } from "lucide-react";

interface UserDisplay {
  id: string;
  name: string;
  email: string;
}

interface UserRowProps {
  user: UserDisplay;
  isSelected: boolean;
  onToggle: (id: string) => void;
  actionButton: React.ReactNode;
}

export function UserRow({
  user,
  isSelected,
  onToggle,
  actionButton,
}: UserRowProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        isSelected
          ? "bg-primary/5 border-primary/20"
          : "bg-surface-card hover:bg-canvas/50"
      }`}
    >
      <button
        onClick={() => onToggle(user.id)}
        className="text-muted-foreground hover:text-ink"
      >
        {isSelected ? (
          <CheckSquare className="h-4.5 w-4.5 text-primary" />
        ) : (
          <Square className="h-4.5 w-4.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      {actionButton}
    </div>
  );
}
