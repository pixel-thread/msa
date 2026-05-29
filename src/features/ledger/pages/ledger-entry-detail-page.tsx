'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLedgerEntries } from '../hooks/useLedgerEntries';
import { useLedgerAccounts } from '../hooks/useLedgerAccounts';
import { useApproveEntry } from '../hooks/useApproveEntry';
import { Card, CardContent } from '@src/shared/components/ui/card';
import { Button } from '@src/shared/components/ui/button';
import { Badge } from '@src/shared/components/ui/badge';
import { SectionHeader } from '@src/shared/components/section-header';
import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { useLedgerLineColumns } from '../hooks/useLedgerLineColumns';
import { formatDate } from '@src/shared/utils/format';
import { ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Loading } from '@components/loading';

export default function LedgerEntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params?.entryId as string;

  const { entries, isLoading: entriesLoading } = useLedgerEntries({
    page: 1,
  });
  const { accounts, isLoading: accountsLoading } = useLedgerAccounts();
  const approveEntry = useApproveEntry();

  const entry = useMemo(() => {
    return entries.find((e) => e.id === entryId) ?? null;
  }, [entries, entryId]);

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : accountId;
  };

  const { columns: lineColumns } = useLedgerLineColumns({ getAccountName });

  if (entriesLoading || accountsLoading) {
    return <Loading />;
  }

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg text-muted-foreground">Entry not found</p>
        <Button variant="outline" onClick={() => router.push('/ledger/entries')}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Entries
        </Button>
      </div>
    );
  }

  const totalDebits = entry.lines
    .filter((l) => l.isDebit)
    .reduce((sum, l) => sum + Number(l.amount), 0);
  const totalCredits = entry.lines
    .filter((l) => !l.isDebit)
    .reduce((sum, l) => sum + Number(l.amount), 0);

  const handleApprove = () => {
    approveEntry.mutate(entry.id, {
      onSuccess: () => {
        toast.success('Entry approved successfully');
      },
    });
  };

  const statusVariant =
    entry.approvalStatus === 'APPROVED'
      ? 'default'
      : entry.approvalStatus === 'REJECTED'
        ? 'destructive'
        : 'secondary';

  return (
    <>
      <SectionHeader
        title="Entry Details"
        description={entry.description}
        onBackClick={() => router.push('/ledger/entries')}
      >
        <Badge variant={statusVariant as 'default' | 'secondary' | 'destructive' | 'outline'}>
          {entry.approvalStatus}
        </Badge>
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Created
            </p>
            <p className="mt-1 text-sm text-ink">{formatDate(entry.createdAt)}</p>
          </CardContent>
        </Card>
        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Debits
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              ₹{totalDebits.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Credits
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              ₹{totalCredits.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className=" border-hairline bg-surface-card">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Ledger Lines</h2>
          <DataTableFilters
            fields={[
              {
                type: 'search',
                id: 'search',
                placeholder: 'Search lines...',
              },
            ]}
            onFilterChange={() => {}}
          />

          <DataTable columns={lineColumns} data={entry.lines} />
        </CardContent>
      </Card>

      {entry.approvalStatus === 'PENDING' && (
        <div className="flex justify-end">
          <Button onClick={handleApprove} disabled={approveEntry.isPending}>
            {approveEntry.isPending ? 'Approving...' : 'Approve Entry'}
          </Button>
        </div>
      )}
    </>
  );
}
