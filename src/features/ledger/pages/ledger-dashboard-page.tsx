"use client";

import Link from "next/link";
import { useLedgerSummary } from "../hooks/useLedgerSummary";
import { useLedgerEntries } from "../hooks/useLedgerEntries";
import { Card, CardContent } from "@src/shared/components/ui/card";
import { Button } from "@src/shared/components/ui/button";
import { formatDate } from "@src/shared/utils/format";
import {
  ArrowRightIcon,
  FileTextIcon,
  CheckCircleIcon,
  BanknoteIcon,
} from "lucide-react";

export default function LedgerDashboardPage() {
  const { summary, isLoading: summaryLoading } = useLedgerSummary();
  const { entries, meta, isLoading: entriesLoading } = useLedgerEntries({
    page: 1,
    pageSize: 10,
  });

  const totalAccounts = summary?.accounts?.length ?? 0;
  const pendingEntries = entries.filter(
    (e) => e.approvalStatus === "PENDING",
  ).length;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Ledger Dashboard
          </h1>
          <p className="mt-1 text-base text-body">
            Overview of accounts, entries, and financial activity
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className=" bg-blue-50 p-2.5">
                <FileTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Entries
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-ink">
                  {summaryLoading ? "..." : meta?.total.toLocaleString() ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className=" bg-amber-50 p-2.5">
                <CheckCircleIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pending Approvals
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-ink">
                  {entriesLoading ? "..." : pendingEntries}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className=" bg-green-50 p-2.5">
                <BanknoteIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Accounts
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-ink">
                  {summaryLoading ? "..." : totalAccounts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className=" border-hairline bg-surface-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink">
              Recent Entries
            </h2>
            <Link href="/ledger/entries">
              <Button variant="ghost" size="sm" className="text-sm">
                View All
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="overflow-hidden border">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Description
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Lines
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {entriesLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      No entries found
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-hairline">
                      <td className="px-4 py-3 text-sm text-ink max-w-[300px] truncate">
                        {entry.description}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${
                            entry.approvalStatus === "APPROVED"
                              ? "bg-green-50 text-green-700"
                              : entry.approvalStatus === "REJECTED"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {entry.approvalStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {entry.lines.length}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/ledger/entries">
          <Card className=" border-hairline bg-surface-card hover:bg-surface-soft cursor-pointer transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink">Manage Entries</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View, create, and approve ledger entries
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/ledger/accounts">
          <Card className=" border-hairline bg-surface-card hover:bg-surface-soft cursor-pointer transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink">
                  Manage Accounts
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View and manage Chart of Accounts
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
