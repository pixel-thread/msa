'use client';

import { CheckSquare, Square } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';

interface UserDisplay {
  id: string;
  name: string;
  email: string;
}

interface UserRowProps {
  user: UserDisplay;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onClickRow?: (id: string) => void;
  actionButton: React.ReactNode;
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-orange-500',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function UserRow({ user, isSelected, onToggle, onClickRow, actionButton }: UserRowProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 border transition-all cursor-pointer ${
        isSelected ? 'bg-primary/5 border-primary/20' : 'bg-surface-card hover:bg-canvas/50'
      }`}
      onClick={() => onClickRow?.(user.id)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle(user.id)}
          className="text-muted-foreground hover:text-ink h-auto w-auto"
        >
          {isSelected ? (
            <CheckSquare className="h-4.5 w-4.5 text-primary" />
          ) : (
            <Square className="h-4.5 w-4.5" />
          )}
        </Button>
      </div>

      <div
        className={`flex items-center justify-center w-8 h-8 text-white text-xs font-bold shrink-0 ${getAvatarColor(user.name)}`}
      >
        {getInitials(user.name)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      <div onClick={(e) => e.stopPropagation()}>{actionButton}</div>
    </div>
  );
}
