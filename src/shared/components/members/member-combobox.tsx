"use client";

import { useState } from "react";
import { useMemberSearch } from "@src/features/payments/hooks/useMemberSearch";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxEmpty,
} from "@src/shared/components/ui/combobox";

interface MemberComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MemberCombobox({
  value,
  onValueChange,
  placeholder = "Search member...",
  disabled = false,
}: MemberComboboxProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { results, isLoading } = useMemberSearch(searchQuery);

  return (
    <Combobox
      value={value ?? null}
      onValueChange={(newValue) => onValueChange?.(newValue ?? "")}
      onInputValueChange={(inputValue) => setSearchQuery(inputValue ?? "")}
    >
      <ComboboxInput
        placeholder={placeholder}
        disabled={disabled}
        showClear
      />
      <ComboboxContent>
        <ComboboxList>
          {isLoading ? (
            <ComboboxEmpty>Searching...</ComboboxEmpty>
          ) : results.length === 0 ? (
            <ComboboxEmpty>No members found</ComboboxEmpty>
          ) : (
            results.map((member) => (
              <ComboboxItem key={member.id} value={member.id}>
                {member.name}
                <span className="text-xs text-muted-foreground">
                  {member.email}
                  {member.membershipNumber ? ` #${member.membershipNumber}` : ""}
                </span>
              </ComboboxItem>
            ))
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
