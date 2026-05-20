"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { useContributions } from "@src/features/payments/hooks/useContributions";
import { ContributionsTable, ContributionFilters } from "@src/features/payments/components";
import { SubscriptionsPagination } from "@src/features/subscriptions/components/subscriptions-pagination";
import { Button } from "@src/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { Label } from "@src/shared/components/ui/label";
import { CalendarDays, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ContributionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const currentPage = Number(searchParams.get("page")) || 1;
  const [filters, setFilters] = useState<Record<string, string | number | undefined>>({});
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));

  const { contributions, meta, isLoading } = useContributions({
    page: currentPage,
    ...filters,
  });

  const generateContributions = useMutation({
    mutationFn: () =>
      http.post("/payments/contributions", {
        year: parseInt(year, 10),
        month: parseInt(month, 10),
      }),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || "Contributions generated successfully");
        queryClient.invalidateQueries({ queryKey: ["all-contributions"] });
        setGenerateDialogOpen(false);
      } else {
        toast.error(response.message || "Failed to generate contributions");
      }
    },
    onError: () => {
      toast.error("Failed to generate contributions");
    },
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/payments/contributions?${params.toString()}`);
  };

  const handleFilterChange = (newFilters: Record<string, string | number | undefined>) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    params.set("page", "1");
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value));
    });
    router.push(`/payments/contributions?${params.toString()}`);
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
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Contributions
          </h1>
          <p className="mt-1 text-base text-body">
            Manage monthly contribution periods for all members
          </p>
        </div>
        <Button onClick={() => setGenerateDialogOpen(true)} className="h-10">
          <Plus className="mr-2 h-4 w-4" />
          Generate Contributions
        </Button>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-4">
        <ContributionFilters onFilterChange={handleFilterChange} />
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-muted" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Contribution Periods ({meta?.total || 0})
            </h2>
          </div>
          <ContributionsTable contributions={contributions} isLoading={isLoading} />
        </div>
      </div>

      {meta && meta.totalPages > 1 && (
        <SubscriptionsPagination
          meta={meta}
          onPageChange={handlePageChange}
          label="contributions"
        />
      )}

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Generate Contributions</DialogTitle>
            <DialogDescription>
              Create contribution periods for all active members for the selected month.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="year">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="month">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => generateContributions.mutate()}
              disabled={generateContributions.isPending}
            >
              {generateContributions.isPending ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
