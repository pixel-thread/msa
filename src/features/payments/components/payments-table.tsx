"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@src/shared/components/ui/table";
import { Badge } from "@src/shared/components/ui/badge";
import { PaymentTransaction } from "../types";

interface PaymentsTableProps {
  payments: PaymentTransaction[];
  isLoading: boolean;
}

export function PaymentsTable({ payments, isLoading }: PaymentsTableProps) {
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

  const getMethodBadge = (method: string | null) => {
    if (!method) return null;
    return (
      <Badge variant="outline" className="capitalize">
        {method.toLowerCase().replace("_", " ")}
      </Badge>
    );
  };

  const formatAmount = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading payments...</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-base text-body">No payments found</p>
        <p className="text-sm text-muted mt-1">
          Try adjusting your filters or record a new payment
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Gateway</TableHead>
          <TableHead>Reference</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {formatDate(tx.paymentDate)}
                </span>
                {tx.notes && (
                  <span className="text-xs text-muted line-clamp-1">
                    {tx.notes}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Link
                href={`/payments/users/${tx.userId}`}
                className="text-sm text-primary hover:underline"
              >
                {tx.user?.name || tx.userId.slice(0, 8)}
              </Link>
              {tx.user?.email && (
                <div className="text-xs text-muted">{tx.user.email}</div>
              )}
            </TableCell>
            <TableCell>
              <span className="text-sm font-medium">
                {formatAmount(tx.amount, tx.currency)}
              </span>
            </TableCell>
            <TableCell>{getStatusBadge(tx.status)}</TableCell>
            <TableCell>{getMethodBadge(tx.method)}</TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {tx.gateway.toLowerCase()}
              </Badge>
            </TableCell>
            <TableCell>
              <Link
                href={`/payments/${tx.id}`}
                className="text-xs text-primary hover:underline"
              >
                {tx.referenceNumber || tx.receiptNumber || tx.razorpayPaymentId || tx.id.slice(0, 8)}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
