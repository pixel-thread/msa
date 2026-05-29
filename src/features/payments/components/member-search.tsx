'use client';

import { useState, useRef } from 'react';
import { useMemberSearch } from '@src/features/payments/hooks/useMemberSearch';
import { Input } from '@src/shared/components/ui/input';
import { Button } from '@src/shared/components/ui/button';
import { Search, X, User } from 'lucide-react';

interface MemberSearchProps {
  onSelect: (member: { id: string; name: string; email: string }) => void;
}

export function MemberSearch({ onSelect }: MemberSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading } = useMemberSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (member: { id: string; name: string; email: string }) => {
    onSelect(member);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search member by name, email, or membership number..."
          className="h-10 pl-9 pr-8"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full border border-hairline bg-surface-card shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <p className="text-sm text-body">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <User className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-body">No members found</p>
            </div>
          ) : (
            <ul className="py-1">
              {results.map((member) => (
                <li key={member.id}>
                  <Button
                    variant="ghost"
                    onClick={() => handleSelect(member)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-strong h-auto"
                  >
                    <div className="flex h-8 w-8 items-center justify-center bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                        {member.membershipNumber && (
                          <span className="ml-1">#{member.membershipNumber}</span>
                        )}
                      </p>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isOpen && query.length < 2 && query.length > 0 && (
        <div className="absolute z-50 mt-1 w-full border border-hairline bg-surface-card p-4 shadow-lg">
          <p className="text-sm text-muted-foreground text-center">
            Type at least 2 characters to search
          </p>
        </div>
      )}
    </div>
  );
}
