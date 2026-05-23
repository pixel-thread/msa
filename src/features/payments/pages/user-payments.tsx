"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUserPayments } from "@src/features/payments/hooks/useUserPayments";
import { PaymentsTable } from "@src/features/payments/components";
import { DataTablePagination } from "@src/shared/components/data-table-pagination";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@src/shared/components/ui/card";
import { Badge } from "@src/shared/components/ui/badge";
import { Separator } from "@src/shared/components/ui/separator";
import { Button } from "@src/shared/components/ui/button";
import {
  ArrowLeft,
  CreditCard,
  Clock,
  AlertCircle,
  Receipt,
} from "lucide-react";
import Link from "next/link";

export function UserPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const userId = params.userId as string;

  const { user, transactions, summary, meta, isLoading } = useUserPayments({
    userId,
    page: currentPage,
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/payments/users/${userId}?${params.toString()}`);
  };

  const formatAmount = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
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
          className="mt-4 h-11 rounded-full border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            {user.name}
          </h1>
          <p className="mt-1 text-base text-body">
            Payment history and contribution summary
            {user.email && (
              <span className="ml-2 text-muted-foreground">({user.email})</span>
            )}
            {user.membershipNumber && (
              <span className="ml-2 text-muted-foreground">
                #{user.membershipNumber}
              </span>
            )}
          </p>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Expected
                  </p>
                  <p className="text-lg font-medium text-ink mt-1">
                    {formatAmount(summary.totalExpected)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Paid
                  </p>
                  <p className="text-lg font-medium text-green-600 mt-1">
                    {formatAmount(summary.totalPaid)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Due
                  </p>
                  <p className="text-lg font-medium text-red-600 mt-1">
                    {formatAmount(summary.totalDue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Overdue Months
                  </p>
                  <p className="text-lg font-medium text-ink mt-1">
                    {summary.overdueMonths}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-xl border-hairline bg-surface-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Payment Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentsTable payments={transactions} isLoading={isLoading} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Contribution Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Paid Months
                    </span>
                    <Badge variant="default">{summary.paidMonths}</Badge>
                  </div>
                  <Separator className="bg-hairline" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Partial Months
                    </span>
                    <Badge variant="outline">{summary.partialMonths}</Badge>
                  </div>
                  <Separator className="bg-hairline" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Overdue Months
                    </span>
                    <Badge variant="destructive">{summary.overdueMonths}</Badge>
                  </div>
                  <Separator className="bg-hairline" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Waived Months
                    </span>
                    <Badge variant="secondary">{summary.waivedMonths}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-hairline bg-surface-card">
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
      </div>

      <DataTablePagination
        meta={meta}
        onPageChange={handlePageChange}
        label="payments"
      />
    </>
  );
}
