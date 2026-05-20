"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { Button } from "@src/shared/components/ui/button";
import { Filter } from "lucide-react";

interface ContributionFiltersProps {
  onFilterChange: (filters: Record<string, string | number | undefined>) => void;
}

export function ContributionFilters({ onFilterChange }: ContributionFiltersProps) {
  const [status, setStatus] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");

  const applyFilters = () => {
    onFilterChange({
      status: status !== "all" ? status : undefined,
      year: year !== "all" ? parseInt(year, 10) : undefined,
      month: month !== "all" ? parseInt(month, 10) : undefined,
    });
  };

  const resetFilters = () => {
    setStatus("all");
    setYear("all");
    setMonth("all");
    onFilterChange({});
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[160px] h-10">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="DUE">Due</SelectItem>
          <SelectItem value="PARTIAL">Partial</SelectItem>
          <SelectItem value="PAID">Paid</SelectItem>
          <SelectItem value="WAIVED">Waived</SelectItem>
          <SelectItem value="OVERDUE">Overdue</SelectItem>
        </SelectContent>
      </Select>

      <Select value={year} onValueChange={setYear}>
        <SelectTrigger className="w-[120px] h-10">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger className="w-[140px] h-10">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="default" onClick={applyFilters} className="h-10">
        <Filter className="mr-2 h-4 w-4" />
        Apply
      </Button>

      <Button variant="outline" onClick={resetFilters} className="h-10">
        Reset
      </Button>
    </div>
  );
}
