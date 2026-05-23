"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@src/shared/components/ui/table"
import { Badge } from "@src/shared/components/ui/badge"
import type { DashboardOverview } from "@feature/dashboard/services/dashboard.service"

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  REFUNDED: "outline",
  WAIVED: "outline",
}

interface RecentPaymentsTableProps {
  payments: DashboardOverview["recentPayments"]
}

export function RecentPaymentsTable({ payments }: RecentPaymentsTableProps) {
  return (
    <div className="rounded-md border border-hairline">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No payments yet
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.userName}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(payment.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusColor[payment.status] ?? "outline"}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.method ?? "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(payment.paymentDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
