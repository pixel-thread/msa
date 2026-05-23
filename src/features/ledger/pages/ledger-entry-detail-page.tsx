"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLedgerEntries } from "../hooks/useLedgerEntries";
import { useLedgerAccounts } from "../hooks/useLedgerAccounts";
import { useApproveEntry } from "../hooks/useApproveEntry";
import { Card, CardContent } from "@src/shared/components/ui/card";
import { Button } from "@src/shared/components/ui/button";
import { Badge } from "@src/shared/components/ui/badge";
import { formatDate } from "@src/shared/utils/format";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

export default function LedgerEntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params?.entryId as string;

  const { entries, isLoading: entriesLoading } = useLedgerEntries({
    page: 1,
    pageSize: 100,
  });
  const { accounts, isLoading: accountsLoading } = useLedgerAccounts();
  const approveEntry = useApproveEntry();

  const entry = useMemo(() => {
    return entries.find((e) => e.id === entryId) ?? null;
  }, [entries, entryId]);

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : accountId;
  };

  if (entriesLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg text-muted-foreground">Entry not found</p>
        <Button variant="outline" onClick={() => router.push("/ledger/entries")}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Entries
        </Button>
      </div>
    );
  }

  const totalDebits = entry.lines
    .filter((l) => l.isDebit)
    .reduce((sum, l) => sum + Number(l.amount), 0);
  const totalCredits = entry.lines
    .filter((l) => !l.isDebit)
    .reduce((sum, l) => sum + Number(l.amount), 0);

  const handleApprove = () => {
    approveEntry.mutate(entry.id, {
      onSuccess: () => {
        toast.success("Entry approved successfully");
      },
    });
  };

  const statusVariant =
    entry.approvalStatus === "APPROVED"
      ? "default"
      : entry.approvalStatus === "REJECTED"
        ? "destructive"
        : "secondary";

  return (
    <>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/ledger/entries")}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Entry Details
          </h1>
          <p className="mt-1 text-base text-body">{entry.description}</p>
        </div>
        <Badge variant={statusVariant as "default" | "secondary" | "destructive" | "outline"}>
          {entry.approvalStatus}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Created
            </p>
            <p className="mt-1 text-sm text-ink">
              {formatDate(entry.createdAt)}
            </p>
          </CardContent>
        </Card>
        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Debits
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              ₹{totalDebits.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className=" border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Credits
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              ₹{totalCredits.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className=" border-hairline bg-surface-card">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Ledger Lines</h2>
          <div className="overflow-hidden border">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Account
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {entry.lines.map((line) => (
                  <tr key={line.id} className="border-t border-hairline">
                    <td className="px-4 py-3 text-sm text-ink">
                      {getAccountName(line.accountId)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${
                          line.isDebit
                            ? "bg-blue-50 text-blue-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {line.isDebit ? "Debit" : "Credit"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-ink">
                      ₹{Number(line.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {entry.approvalStatus === "PENDING" && (
        <div className="flex justify-end">
          <Button onClick={handleApprove} disabled={approveEntry.isPending}>
            {approveEntry.isPending ? "Approving..." : "Approve Entry"}
          </Button>
        </div>
      )}
    </>
  );
}
