'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { Separator } from '@src/shared/components/ui/separator';
import { Badge } from '@src/shared/components/ui/badge';
import { User, CreditCard, CalendarDays } from 'lucide-react';
import { ContributionPeriod } from '../types';
import { getMonthName } from '@src/shared/utils/helper/get-month-name';
import { formattedAmount } from '@src/shared/utils';
import { getStatusBadge } from '@src/shared/utils/helper/get-status-badge';

interface ContributionDetailProps {
  contribution: ContributionPeriod;
}

export function ContributionDetail({ contribution }: ContributionDetailProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className=" border-hairline bg-surface-card md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Period Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Period</p>
                <p className="text-lg font-medium text-ink mt-1">
                  {getMonthName(contribution.month)} {contribution.year}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(contribution.status)}</div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expected Amount</p>
                <p className="text-sm text-ink mt-1">
                  {formattedAmount(contribution.expectedAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Paid Amount</p>
                <p className="text-sm text-green-600 mt-1">
                  {formattedAmount(contribution.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Due Amount</p>
                <p className="text-sm text-red-600 mt-1">
                  {formattedAmount(contribution.dueAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Due Date</p>
                <p className="text-sm text-ink mt-1">
                  {new Date(contribution.dueDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className=" border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link
                href={`/payments/users/${contribution.userId}`}
                className="text-sm text-primary hover:underline"
              >
                {contribution.user?.name || 'Unknown'}
              </Link>
              {contribution.user?.email && (
                <p className="text-sm text-muted-foreground">{contribution.user.email}</p>
              )}
              {contribution.user?.membershipNumber && (
                <p className="text-sm text-muted-foreground">
                  #{contribution.user.membershipNumber}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {contribution.waivedAt && (
          <Card className=" border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Waiver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Waived on{' '}
                {new Date(contribution.waivedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              {contribution.waivedReason && (
                <p className="text-sm text-ink mt-2">Reason: {contribution.waivedReason}</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className=" border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Allocations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contribution.allocations.length > 0 ? (
              <div className="space-y-2">
                {contribution.allocations.map((alloc) => (
                  <div key={alloc.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formattedAmount(alloc.allocatedAmount)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {alloc.paymentTransaction.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payment allocations</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
