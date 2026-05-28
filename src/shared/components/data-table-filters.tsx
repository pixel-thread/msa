"use client";

import { useState, useMemo } from "react";
import { Input } from "@src/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { Button } from "@src/shared/components/ui/button";
import { Search, Filter } from "lucide-react";
import { Card } from "@components/ui/card";

export type FilterField =
  | { type: "search"; id: string; placeholder?: string }
  | {
      type: "select";
      id: string;
      label: string;
      options: { value: string; label: string }[];
    };

interface DataTableFiltersProps {
  fields: FilterField[];
  onFilterChange: (filters: Record<string, string | undefined>) => void;
  defaultValues?: Record<string, string>;
}

export function DataTableFilters({
  fields,
  onFilterChange,
  defaultValues,
}: DataTableFiltersProps) {
  const initialValues = useMemo(() => {
    const vals: Record<string, string> = {};
    fields.forEach((f) => {
      vals[f.id] =
        defaultValues?.[f.id] ?? (f.type === "search" ? "" : "all");
    });
    return vals;
  }, [fields, defaultValues]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const applyFilters = () => {
    const filters: Record<string, string | undefined> = {};
    fields.forEach((f) => {
      const v = values[f.id];
      if (f.type === "select") {
        filters[f.id] = v && v !== "all" ? v : undefined;
      } else {
        filters[f.id] = v || undefined;
      }
    });
    onFilterChange(filters);
  };

  const resetFilters = () => {
    const resetVals: Record<string, string> = {};
    const cleared: Record<string, string | undefined> = {};
    fields.forEach((f) => {
      resetVals[f.id] = f.type === "search" ? "" : "all";
      cleared[f.id] = undefined;
    });
    setValues(resetVals);
    onFilterChange(cleared);
  };

  return (
    <Card className="gap-3 p-4 flex-row">
      {fields.map((f) => {
        if (f.type === "search") {
          return (
            <div key={f.id} className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={f.placeholder}
                value={values[f.id]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.id]: e.target.value }))
                }
                className="pl-9 h-10"
              />
            </div>
          );
        }
        return (
          <Select
            key={f.id}
            value={values[f.id]}
            onValueChange={(v) => setValues((prev) => ({ ...prev, [f.id]: v }))}
          >
            <SelectTrigger className="w-[160px] h-10">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {f.label}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
      <Button variant="default" onClick={applyFilters} className="h-10">
        <Filter className="mr-2 h-4 w-4" />
        Apply
      </Button>
      <Button variant="outline" onClick={resetFilters} className="h-10">
        Reset
      </Button>
    </Card>
  );
}
