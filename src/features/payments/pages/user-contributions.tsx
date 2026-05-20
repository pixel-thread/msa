"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useUserContributions } from "@src/features/payments/hooks/useUserContributions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@src/shared/components/ui/card";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@src/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { Label } from "@src/shared/components/ui/label";
import { ArrowLeft, CalendarDays, CreditCard, AlertCircle, Receipt } from "lucide-react";
import Link from "next/link";

export function UserContributionsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [fromYear, setFromYear] = useState<string>("all");
  const [fromMonth, setFromMonth] = useState<string>("all");
  const [toYear, setToYear] = useState<string>("all");
  const [toMonth, setToMonth] = useState<string>("all");

  const { user, contributions, summary, isLoading } = useUserContributions({
    userId,
    fromYear: fromYear !== "all" ? parseInt(fromYear, 10) : undefined,
    fromMonth: fromMonth !== "all" ? parseInt(fromMonth, 10) : undefined,
    toYear: toYear !== "all" ? parseInt(toYear, 10) : undefined,
    toMonth: toMonth !== "all" ? parseInt(toMonth, 10) : undefined,
  });

  const formatAmount = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return months[month - 1] || "";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PAID: "default",
      DUE: "secondary",
      PARTIAL: "outline",
      WAIVED: "secondary",
      OVERDUE: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const applyFilters = () => {
    router.push(`/payments/users/${userId}/contributions`);
  };

  const resetFilters = () => {
    setFromYear("all");
    setFromMonth("all");
    setToYear("all");
    setToMonth("all");
    router.push(`/payments/users/${userId}/contributions`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading user contributions...</p>
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
            {user.name} - Contributions
          </h1>
          <p className="mt-1 text-base text-body">
            Monthly contribution breakdown
            {user.email && <span className="ml-2 text-muted">({user.email})</span>}
          </p>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted" />
                <div>
                  <p className="text-xs font-medium text-muted">Total Expected</p>
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
                  <p className="text-xs font-medium text-muted">Total Paid</p>
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
                  <p className="text-xs font-medium text-muted">Total Due</p>
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
                <CalendarDays className="h-5 w-5 text-muted" />
                <div>
                  <p className="text-xs font-medium text-muted">Overdue</p>
                  <p className="text-lg font-medium text-ink mt-1">
                    {summary.overdueMonths} months
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="rounded-xl border border-hairline bg-surface-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <Label className="text-xs text-muted">From Year</Label>
            <Select value={fromYear} onValueChange={setFromYear}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs text-muted">From Month</Label>
            <Select value={fromMonth} onValueChange={setFromMonth}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs text-muted">To Year</Label>
            <Select value={toYear} onValueChange={setToYear}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs text-muted">To Month</Label>
            <Select value={toMonth} onValueChange={setToMonth}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={applyFilters} className="h-9">Apply</Button>
          <Button variant="outline" onClick={resetFilters} className="h-9">Reset</Button>
        </div>
      </div>

      <Card className="rounded-xl border-hairline bg-surface-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
            Contribution Periods ({contributions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CalendarDays className="h-12 w-12 text-muted mb-4" />
              <p className="text-base text-body">No contributions found</p>
              <p className="text-sm text-muted mt-1">
                Adjust the date range filters or generate contributions
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Payments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((cp) => (
                  <TableRow key={cp.id}>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {getMonthName(cp.month)} {cp.year}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatAmount(cp.expectedAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-green-600">
                        {formatAmount(cp.paidAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-red-600">
                        {formatAmount(cp.dueAmount)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(cp.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted">
                        {new Date(cp.dueDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {cp.allocations.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cp.allocations.map((alloc) => (
                            <Badge
                              key={alloc.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {formatAmount(alloc.allocatedAmount)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted">No payments</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-4">
        <Link
          href={`/payments/users/${userId}`}
          className="text-sm text-primary hover:underline"
        >
          ← Back to Payment History
        </Link>
      </div>
    </>
  );
}
