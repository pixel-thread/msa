'use client';

import { useState } from 'react';
import { MemberSearch } from '@src/features/payments/components/member-search';
import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { usePaymentTransactionColumns } from '@src/features/payments/hooks/usePaymentTransactionColumns';
import { useUserPayments } from '@src/features/payments/hooks/useUserPayments';
import { Card, CardContent } from '@src/shared/components/ui/card';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import { CreditCard, AlertCircle, Receipt, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { formattedAmount } from '@src/shared/utils';

export function UserPaymentsLookupPage() {
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const { user, transactions, summary, meta, isLoading } = useUserPayments({
    userId: selectedMember?.id ?? '',
    page: 1,
  });

  const { columns } = usePaymentTransactionColumns();

  return (
    <>
      <SectionHeader
        title="Member Payments"
        description="Search for a member to view their payment history"
      />

      <div className=" border border-hairline bg-surface-card p-4">
        <MemberSearch onSelect={(member) => setSelectedMember(member)} />
      </div>

      {!selectedMember ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-hairline bg-surface-card">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-base text-body">Select a member to view their payment history</p>
          <p className="text-sm text-muted-foreground mt-1">
            Search by name, email, or membership number
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-body">Loading {selectedMember.name}&apos;s payments...</p>
        </div>
      ) : (
        <>
          {summary && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card className=" border-hairline bg-surface-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Total Expected</p>
                      <p className="text-lg font-medium text-ink mt-1">
                        {formattedAmount(summary.totalExpected)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className=" border-hairline bg-surface-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
                      <p className="text-lg font-medium text-green-600 mt-1">
                        {formattedAmount(summary.totalPaid)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className=" border-hairline bg-surface-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Total Due</p>
                      <p className="text-lg font-medium text-red-600 mt-1">
                        {formattedAmount(summary.totalDue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className=" border-hairline bg-surface-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Overdue Months</p>
                      <p className="text-lg font-medium text-ink mt-1">{summary.overdueMonths}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className=" border border-hairline bg-surface-card">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Payment Transactions ({meta?.total || transactions.length})
                  </h2>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/payments/users/${selectedMember.id}/contributions`}>
                    View Contributions
                  </Link>
                </Button>
              </div>
              <DataTableFilters
                fields={[
                  {
                    type: 'search',
                    id: 'search',
                    placeholder: 'Search transactions...',
                  },
                ]}
                onFilterChange={() => {}}
              />

              <DataTable columns={columns} data={transactions} loading={isLoading} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
