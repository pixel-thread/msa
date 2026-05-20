"use client";

import { useParams, useRouter } from "next/navigation";
import { usePaymentDetail } from "@src/features/payments/hooks/usePaymentDetail";
import { Button } from "@src/shared/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@src/shared/components/ui/card";
import { Badge } from "@src/shared/components/ui/badge";
import { Separator } from "@src/shared/components/ui/separator";
import { ArrowLeft, User, CreditCard } from "lucide-react";
import Link from "next/link";

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
          className="mt-4 h-11 rounded-full border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </div>
    );
  }

  const formatAmount = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      COMPLETED: "default",
      PENDING: "secondary",
      FAILED: "destructive",
      REFUNDED: "outline",
      WAIVED: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Payment Details
          </h1>
          <p className="mt-1 text-base text-body">
            Transaction ID: {payment.id.slice(0, 8)}...
          </p>
        </div>
        <div className="ml-auto">{getStatusBadge(payment.status)}</div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-xl border-hairline bg-surface-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
              Transaction Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted">Amount</p>
                  <p className="text-lg font-medium text-ink mt-1">
                    {formatAmount(payment.amount, payment.currency)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">Gateway</p>
                  <p className="text-sm text-ink mt-1 capitalize">
                    {payment.gateway.toLowerCase()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">Method</p>
                  <p className="text-sm text-ink mt-1 capitalize">
                    {payment.method ? payment.method.toLowerCase().replace("_", " ") : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">Payment Date</p>
                  <p className="text-sm text-ink mt-1">
                    {formatDate(payment.paymentDate)}
                  </p>
                </div>
              </div>

              <Separator className="bg-hairline" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted">Reference Number</p>
                  <p className="text-sm text-ink mt-1">
                    {payment.referenceNumber || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">Receipt Number</p>
                  <p className="text-sm text-ink mt-1">
                    {payment.receiptNumber || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">Razorpay Payment ID</p>
                  <p className="text-sm text-ink mt-1 font-mono text-xs">
                    {payment.razorpayPaymentId || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">Razorpay Order ID</p>
                  <p className="text-sm text-ink mt-1 font-mono text-xs">
                    {payment.razorpayOrderId || "-"}
                  </p>
                </div>
              </div>

              {payment.notes && (
                <>
                  <Separator className="bg-hairline" />
                  <div>
                    <p className="text-xs font-medium text-muted">Notes</p>
                    <p className="text-sm text-ink mt-1">{payment.notes}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted flex items-center gap-2">
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
                  {payment.user?.name || "Unknown User"}
                </Link>
                {payment.user?.email && (
                  <p className="text-sm text-muted">{payment.user.email}</p>
                )}
                {payment.user?.membershipNumber && (
                  <p className="text-sm text-muted">
                    #{payment.user.membershipNumber}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Allocations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payment.allocations && payment.allocations.length > 0 ? (
                <div className="space-y-2">
                  {payment.allocations.map((alloc) => (
                    <div
                      key={alloc.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted">
                        {new Date(alloc.contributionPeriod.year, alloc.contributionPeriod.month - 1).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="font-medium">
                        {formatAmount(alloc.allocatedAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No allocations</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted">Created</p>
                  <p className="text-sm text-ink mt-1">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted">Paid At</p>
                  <p className="text-sm text-ink mt-1">
                    {formatDate(payment.paidAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted">Last Updated</p>
                  <p className="text-sm text-ink mt-1">
                    {formatDate(payment.updatedAt)}
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
