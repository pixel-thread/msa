'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUrlFilters } from '@src/shared/hooks';
import { useUserPayments } from '@src/features/payments/hooks/useUserPayments';
import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { usePaymentTransactionColumns } from '@src/features/payments/hooks/usePaymentTransactionColumns';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { Badge } from '@src/shared/components/ui/badge';
import { Separator } from '@src/shared/components/ui/separator';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import { CreditCard, Clock, AlertCircle, Receipt } from 'lucide-react';
import Link from 'next/link';

export function UserPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { page, setPage } = useUrlFilters({
    basePath: `/payments/users/${userId}`,
  });

  const { user, transactions, summary, meta, isLoading } = useUserPayments({
    userId,
    page,
  });

  const { columns } = usePaymentTransactionColumns();

  const formatAmount = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading user payments...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-lg text-body">User not found</p>
        <Button
          variant="outline"
          className="mt-4 h-11 border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title={user.name}
        description={
          <>
            Payment history and contribution summary
            {user.email && <span className="ml-2 text-muted-foreground">({user.email})</span>}
            {user.membershipNumber && (
              <span className="ml-2 text-muted-foreground">#{user.membershipNumber}</span>
            )}
          </>
        }
      />

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className=" border-hairline bg-surface-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Expected</p>
                  <p className="text-lg font-medium text-ink mt-1">
                    {formatAmount(summary.totalExpected)}
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
                    {formatAmount(summary.totalPaid)}
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
                    {formatAmount(summary.totalDue)}
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

      <div className="space-y-6">
        <Card className=" border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Contribution Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paid Months</span>
                  <Badge variant="default">{summary.paidMonths}</Badge>
                </div>
                <Separator className="bg-hairline" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Partial Months</span>
                  <Badge variant="outline">{summary.partialMonths}</Badge>
                </div>
                <Separator className="bg-hairline" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overdue Months</span>
                  <Badge variant="destructive">{summary.overdueMonths}</Badge>
                </div>
                <Separator className="bg-hairline" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Waived Months</span>
                  <Badge variant="secondary">{summary.waivedMonths}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className=" border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href={`/payments/users/${userId}/contributions`}
                className="block text-sm text-primary hover:underline"
              >
                View Contributions →
              </Link>
              <Link
                href={`/members/${userId}`}
                className="block text-sm text-primary hover:underline"
              >
                View Member Profile →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTablePagination meta={meta} onPageChange={setPage} label="payments" />
    </>
  );
}
