"use client";

import { useState } from "react";
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

interface PaymentFiltersProps {
  onFilterChange: (filters: Record<string, string | undefined>) => void;
}

export function PaymentFilters({ onFilterChange }: PaymentFiltersProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [method, setMethod] = useState<string>("all");
  const [gateway, setGateway] = useState<string>("all");

  const applyFilters = () => {
    onFilterChange({
      search: search || undefined,
      status: status !== "all" ? status : undefined,
      method: method !== "all" ? method : undefined,
      gateway: gateway !== "all" ? gateway : undefined,
    });
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setMethod("all");
    setGateway("all");
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search reference, receipt, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[160px] h-10">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="FAILED">Failed</SelectItem>
          <SelectItem value="REFUNDED">Refunded</SelectItem>
          <SelectItem value="WAIVED">Waived</SelectItem>
        </SelectContent>
      </Select>

      <Select value={method} onValueChange={setMethod}>
        <SelectTrigger className="w-[160px] h-10">
          <SelectValue placeholder="Method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Methods</SelectItem>
          <SelectItem value="CASH">Cash</SelectItem>
          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
          <SelectItem value="UPI">UPI</SelectItem>
          <SelectItem value="CHEQUE">Cheque</SelectItem>
          <SelectItem value="ONLINE">Online</SelectItem>
        </SelectContent>
      </Select>

      <Select value={gateway} onValueChange={setGateway}>
        <SelectTrigger className="w-[160px] h-10">
          <SelectValue placeholder="Gateway" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Gateways</SelectItem>
          <SelectItem value="RAZORPAY">Razorpay</SelectItem>
          <SelectItem value="MANUAL">Manual</SelectItem>
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
