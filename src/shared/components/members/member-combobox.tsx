'use client';

import { useState, useRef, useEffect } from 'react';
import { useMemberSearch } from '@src/features/payments/hooks/useMemberSearch';
import { Input } from '@src/shared/components/ui/input';
import { Search, X } from 'lucide-react';
import { cn } from '@src/shared/lib/utils';

interface MemberComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MemberCombobox({
  value,
  onValueChange,
  placeholder = 'Search member...',
  disabled = false,
}: MemberComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const { results, isLoading } = useMemberSearch(searchQuery);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    const member = results.find((m) => m.id === id);
    if (member) setSelectedName(member.name);
    onValueChange?.(id);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedName('');
    onValueChange?.('');
    setSearchQuery('');
  };

  const displayValue = searchQuery || (value ? selectedName : '');

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={displayValue}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-10 pl-9 pr-8"
        />
        {value && !searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full border bg-popover shadow-md">
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
          ) : results.length === 0 && searchQuery.length >= 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No members found</div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          ) : (
            <ul className="py-1">
              {results.map((member) => (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(member.id)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent',
                      member.id === value && 'bg-accent',
                    )}
                  >
                    <span>{member.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {member.email}
                      {member.membershipNumber ? ` #${member.membershipNumber}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
