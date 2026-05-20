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
import { ContributionPeriod } from "../types";
import { getMonthName } from "@src/shared/utils/helper/get-month-name";
import { formattedAmount } from "@src/shared/utils";
import { getStatusBadge } from "@src/shared/utils/helper/get-status-badge";

interface ContributionsTableProps {
  contributions: ContributionPeriod[];
  isLoading: boolean;
}

export function ContributionsTable({
  contributions,
  isLoading,
}: ContributionsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading contributions...</p>
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-base text-body">No contributions found</p>
        <p className="text-sm text-muted mt-1">
          Try adjusting your filters or generate contributions for a new month
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Expected</TableHead>
          <TableHead>Paid</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contributions.map((cp) => (
          <TableRow key={cp.id}>
            <TableCell>
              <Link
                href={`/payments/users/${cp.userId}`}
                className="text-sm text-primary hover:underline"
              >
                {cp.user?.name || cp.userId.slice(0, 8)}
              </Link>
              {cp.user?.email && (
                <div className="text-xs text-muted">{cp.user.email}</div>
              )}
            </TableCell>
            <TableCell>
              <span className="text-sm font-medium">
                {getMonthName(cp.month)} {cp.year}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm">
                {formattedAmount(cp.expectedAmount)}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-green-600">
                {formattedAmount(cp.paidAmount)}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-red-600">
                {formattedAmount(cp.dueAmount)}
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
