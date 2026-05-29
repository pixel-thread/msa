'use client';

import Link from 'next/link';
import { useLedgerSummary } from '../hooks/useLedgerSummary';
import { useLedgerEntries } from '../hooks/useLedgerEntries';
import { Card, CardContent } from '@src/shared/components/ui/card';
import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { useRecentLedgerEntryColumns } from '../hooks/useRecentLedgerEntryColumns';
import { ArrowRightIcon, FileTextIcon, CheckCircleIcon, BanknoteIcon } from 'lucide-react';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { useUrlFilters } from '@src/shared/hooks';

export default function LedgerDashboardPage() {
  const { page, setPage } = useUrlFilters({ basePath: '/ledger' });
  const { summary, isLoading: summaryLoading } = useLedgerSummary();
  const {
    entries,
    meta,
    isLoading: entriesLoading,
  } = useLedgerEntries({
    page,
  });

  const totalAccounts = summary?.accounts?.length ?? 0;
  const pendingEntries = entries.filter((e) => e.approvalStatus === 'PENDING').length;

  const { columns: entryColumns } = useRecentLedgerEntryColumns();

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Ledger Dashboard
          </h1>
          <p className="mt-1 text-base text-body">
            Overview of accounts, entries, and financial activity
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className=" bg-blue-50 p-2.5">
                <FileTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Entries
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-ink">
                  {summaryLoading ? '...' : (meta?.total.toLocaleString() ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className=" bg-amber-50 p-2.5">
                <CheckCircleIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pending Approvals
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-ink">
                  {entriesLoading ? '...' : pendingEntries}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className=" bg-green-50 p-2.5">
                <BanknoteIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Accounts
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-ink">
                  {summaryLoading ? '...' : totalAccounts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTableFilters
        fields={[
          {
            type: 'search',
            id: 'search',
            placeholder: 'Search entries...',
          },
        ]}
        onFilterChange={() => {}}
      />
      <DataTable columns={entryColumns} data={entries} loading={entriesLoading} />
      <DataTablePagination meta={meta} onPageChange={setPage} />

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/ledger/entries">
          <Card className=" border-hairline bg-surface-card hover:bg-surface-soft cursor-pointer transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink">Manage Entries</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View, create, and approve ledger entries
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/ledger/accounts">
          <Card className=" border-hairline bg-surface-card hover:bg-surface-soft cursor-pointer transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink">Manage Accounts</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View and manage Chart of Accounts
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
