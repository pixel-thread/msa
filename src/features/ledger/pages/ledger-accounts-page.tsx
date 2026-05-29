'use client';

import { useState } from 'react';
import { useLedgerAccounts } from '../hooks/useLedgerAccounts';
import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { Card, CardContent } from '@src/shared/components/ui/card';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import { CreateAccountDialog } from '../components/create-account-dialog';
import { useLedgerAccountColumns } from '../hooks/useLedgerAccountColumns';
import { Plus, BanknoteIcon } from 'lucide-react';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { useUrlFilters } from '@src/shared/hooks';

export default function LedgerAccountsPage() {
  const { page, setPage } = useUrlFilters({ basePath: '/ledger/accounts' });
  const { accounts, isLoading, meta } = useLedgerAccounts();
  const [createOpen, setCreateOpen] = useState(false);
  const { columns } = useLedgerAccountColumns();

  return (
    <>
      <SectionHeader
        title="Chart of Accounts"
        description="Manage the Chart of Accounts for your association"
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Account
        </Button>
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className=" bg-green-50 p-2.5">
                <BanknoteIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Accounts
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-ink">{accounts.length}</p>
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
            placeholder: 'Search accounts...',
          },
        ]}
        onFilterChange={() => {}}
      />

      <DataTable loading={isLoading} data={accounts} columns={columns} />
      <DataTablePagination meta={meta} onPageChange={setPage} />

      <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
