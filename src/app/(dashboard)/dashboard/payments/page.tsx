"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "@phosphor-icons/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/shared/components/ui/card";
import { Badge } from "@src/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@src/shared/components/ui/table";
import http from "@src/shared/utils/http";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  receiptNumber: string | null;
  notes: string | null;
  paymentDate: string;
  user: {
    name: string;
    email: string;
  };
}

export default function PaymentsPage() {
  const { data, isLoading } = useQuery<{ payments: Payment[] }>({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await http.get<{ payments: Payment[] }>("/subscriptions/all");
      if (!res.success || !res.data) throw new Error("Failed to fetch payments");
      return res.data;
    },
  });

  const payments = data?.payments ?? [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      COMPLETED: "default",
      PENDING: "outline",
      FAILED: "destructive",
      REFUNDED: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const totalCollected = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage membership payments.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-semibold">{formatCurrency(totalCollected)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {payments.filter((p) => p.status === "COMPLETED").length} payments
            </p>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-semibold">
              {payments.filter((p) => p.status === "PENDING").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-semibold">{payments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Payment History</CardTitle>
              <CardDescription className="text-sm">
                All membership payments in your association
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-muted/50">
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="border-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-sm">{payment.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {payment.user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(payment.amount, payment.currency)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {payment.receiptNumber || "-"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDate(payment.paymentDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}