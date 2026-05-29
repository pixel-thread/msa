'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePaymentDetail } from '@src/features/payments/hooks/usePaymentDetail';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { Separator } from '@src/shared/components/ui/separator';
import { User, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { getStatusBadge } from '@src/shared/utils/helper/get-status-badge';
import { formatDate, formattedAmount } from '@src/shared/utils';

export function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.paymentId as string;

  const { payment, isLoading } = usePaymentDetail(paymentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading payment details...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-lg text-body">Payment not found</p>
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
        title="Payment Details"
        description={`Transaction ID: ${payment.id.slice(0, 8)}...`}
      >
        {getStatusBadge(payment.status)}
      </SectionHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className=" border-hairline bg-surface-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Transaction Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Amount</p>
                  <p className="text-lg font-medium text-ink mt-1">
                    {formattedAmount(payment.amount, payment.currency)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Gateway</p>
                  <p className="text-sm text-ink mt-1 capitalize">
                    {payment.gateway.toLowerCase()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Method</p>
                  <p className="text-sm text-ink mt-1 capitalize">
                    {payment.method ? payment.method.toLowerCase().replace('_', ' ') : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Payment Date</p>
                  <p className="text-sm text-ink mt-1">
                    {payment.paymentDate ? formatDate(payment.paymentDate) : 'N/A'}
                  </p>
                </div>
              </div>

              <Separator className="bg-hairline" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Reference Number</p>
                  <p className="text-sm text-ink mt-1">{payment.referenceNumber || '-'}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Receipt Number</p>
                  <p className="text-sm text-ink mt-1">{payment.receiptNumber || '-'}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Razorpay Payment ID</p>
                  <p className="text-sm text-ink mt-1 font-mono text-xs">
                    {payment.razorpayPaymentId || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Razorpay Order ID</p>
                  <p className="text-sm text-ink mt-1 font-mono text-xs">
                    {payment.razorpayOrderId || '-'}
                  </p>
                </div>
              </div>

              {payment.notes && (
                <>
                  <Separator className="bg-hairline" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm text-ink mt-1">{payment.notes}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className=" border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link
                  href={`/payments/users/${payment.userId}`}
                  className="text-sm text-primary hover:underline"
                >
                  {payment.user?.name || 'Unknown User'}
                </Link>
                {payment.user?.email && (
                  <p className="text-sm text-muted-foreground">{payment.user.email}</p>
                )}
                {payment.user?.membershipNumber && (
                  <p className="text-sm text-muted-foreground">#{payment.user.membershipNumber}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className=" border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Allocations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payment.allocations && payment.allocations.length > 0 ? (
                <div className="space-y-2">
                  {payment.allocations.map((alloc) => (
                    <div key={alloc.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(
                          alloc.contributionPeriod.year,
                          alloc.contributionPeriod.month - 1,
                        ).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="font-medium">{formattedAmount(alloc.allocatedAmount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No allocations</p>
              )}
            </CardContent>
          </Card>

          <Card className=" border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Created</p>
                  <p className="text-sm text-ink mt-1">
                    {payment.createdAt ? formatDate(payment.createdAt || '') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Paid At</p>
                  <p className="text-sm text-ink mt-1">
                    {payment.createdAt ? formatDate(payment.paidAt || '') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-sm text-ink mt-1">
                    {payment.createdAt ? formatDate(payment.updatedAt || '') : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
