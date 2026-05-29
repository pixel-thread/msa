'use client';

import { useState, useMemo } from 'react';
import { useUrlFilters } from '@src/shared/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { useContributions } from '@src/features/payments/hooks/useContributions';
import { DataTableFilters, type FilterField } from '@src/shared/components/data-table-filters';
import { DataTable } from '@src/shared/components/data-table';
import { useContributionPeriodColumns } from '@src/features/payments/hooks/useContributionPeriodColumns';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import { Card } from '@components/ui/card';
import { Label } from '@src/shared/components/ui/label';
import { CalendarDays, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ContributionsPage() {
  const queryClient = useQueryClient();
  const { filters, page, setPage, setFilters } = useUrlFilters({
    basePath: '/payments/contributions',
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

  const filterFields: FilterField[] = [
    {
      type: 'select',
      id: 'status',
      label: 'Status',
      options: [
        { value: 'DUE', label: 'Due' },
        { value: 'PARTIAL', label: 'Partial' },
        { value: 'PAID', label: 'Paid' },
        { value: 'WAIVED', label: 'Waived' },
        { value: 'OVERDUE', label: 'Overdue' },
      ],
    },
    {
      type: 'select',
      id: 'year',
      label: 'Year',
      options: Array.from({ length: 6 }, (_, i) => {
        const y = currentYear - 5 + i;
        return { value: String(y), label: String(y) };
      }),
    },
    {
      type: 'select',
      id: 'month',
      label: 'Month',
      options: [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
      ],
    },
  ];
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));

  const apiFilters = useMemo(() => {
    const result: Record<string, string | number | undefined> = { ...filters };
    if (filters.year) result.year = parseInt(filters.year, 10);
    if (filters.month) result.month = parseInt(filters.month, 10);
    return result;
  }, [filters]);

  const { contributions, meta, isLoading } = useContributions({
    page,
    ...apiFilters,
  });

  const { columns } = useContributionPeriodColumns();

  const generateContributions = useMutation({
    mutationFn: () =>
      http.post('/payments/contributions', {
        year: parseInt(year, 10),
        month: parseInt(month, 10),
      }),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Contributions generated successfully');
        queryClient.invalidateQueries({ queryKey: ['all-contributions'] });
        setGenerateDialogOpen(false);
      } else {
        toast.error(response.message || 'Failed to generate contributions');
      }
    },
    onError: () => {
      toast.error('Failed to generate contributions');
    },
  });

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <>
      <SectionHeader
        title="Contributions"
        description="Manage monthly contribution periods for all members"
      >
        <Button onClick={() => setGenerateDialogOpen(true)} className="h-10">
          <Plus className="mr-2 h-4 w-4" />
          Generate Contributions
        </Button>
      </SectionHeader>

      <DataTableFilters fields={filterFields} onFilterChange={setFilters} />

      <DataTable columns={columns} data={contributions} loading={isLoading} />

      <DataTablePagination meta={meta} onPageChange={setPage} label="contributions" />

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
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => generateContributions.mutate()}
              disabled={generateContributions.isPending}
            >
              {generateContributions.isPending ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
