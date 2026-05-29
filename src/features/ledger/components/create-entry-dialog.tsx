'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';
import { Label } from '@src/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import { Textarea } from '@src/shared/components/ui/textarea';
import { useCreateEntry } from '../hooks/useCreateEntry';
import { useLedgerAccounts } from '../hooks/useLedgerAccounts';
import { Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CreateEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LineInput {
  accountId: string;
  isDebit: boolean;
  amount: string;
}

export function CreateEntryDialog({ open, onOpenChange }: CreateEntryDialogProps) {
  const { accounts } = useLedgerAccounts();
  const createEntry = useCreateEntry();
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<LineInput[]>([
    { accountId: '', isDebit: true, amount: '' },
    { accountId: '', isDebit: false, amount: '' },
  ]);

  const addLine = (isDebit: boolean) => {
    setLines([...lines, { accountId: '', isDebit, amount: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof LineInput, value: string | boolean) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value } as LineInput;
    setLines(updated);
  };

  const resetForm = () => {
    setDescription('');
    setLines([
      { accountId: '', isDebit: true, amount: '' },
      { accountId: '', isDebit: false, amount: '' },
    ]);
  };

  // Helper calculations
  const parsedLines = lines.map((l) => ({
    accountId: l.accountId,
    isDebit: l.isDebit,
    amount: parseFloat(l.amount) || 0,
  }));

  const totalDebits = parsedLines.filter((l) => l.isDebit).reduce((sum, l) => sum + l.amount, 0);

  const totalCredits = parsedLines.filter((l) => !l.isDebit).reduce((sum, l) => sum + l.amount, 0);

  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference < 0.01 && totalDebits > 0;
  const hasDebitLine = parsedLines.some((l) => l.isDebit && l.amount > 0 && l.accountId);
  const hasCreditLine = parsedLines.some((l) => !l.isDebit && l.amount > 0 && l.accountId);
  const isValid = isBalanced && hasDebitLine && hasCreditLine && description.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const formattedLines = parsedLines.filter((l) => l.accountId && l.amount > 0);

    createEntry.mutate(
      {
        description,
        lines: formattedLines,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Ledger Entry</DialogTitle>
          <DialogDescription>
            Record a balanced double-entry transaction. Total debits must equal total credits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this transaction (e.g. Purchase of office supplies)"
                rows={2}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Transaction Lines</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => addLine(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Debit
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addLine(false)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Credit
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className="flex items-end gap-2 border border-hairline p-3 bg-surface-card rounded-md"
                  >
                    <div className="w-28 space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={line.isDebit ? 'debit' : 'credit'}
                        onValueChange={(v) => updateLine(index, 'isDebit', v === 'debit')}
                      >
                        <SelectTrigger className="h-9 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debit">DEBIT</SelectItem>
                          <SelectItem value="credit">CREDIT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">Account</Label>
                      <Select
                        value={line.accountId}
                        onValueChange={(v) => updateLine(index, 'accountId', v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name} ({account.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-32 space-y-1.5">
                      <Label className="text-xs">Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={line.amount}
                        onChange={(e) => updateLine(index, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="h-9"
                        required
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLine(index)}
                      disabled={lines.length <= 2}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Balancing Widget */}
            <div className="border border-hairline p-4 rounded-lg bg-surface-soft mt-2 space-y-3">
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Total Debits: </span>
                  <span className="font-semibold text-blue-600">₹{totalDebits.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Credits: </span>
                  <span className="font-semibold text-emerald-600">₹{totalCredits.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-hairline pt-3 flex items-center justify-between">
                {isBalanced ? (
                  <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Transaction is balanced
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-amber-600 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    {totalDebits === 0 && totalCredits === 0
                      ? 'Enter amounts to begin'
                      : `Out of balance by ₹${difference.toFixed(2)}`}
                  </div>
                )}
                <div className="text-xs text-muted-foreground font-mono">
                  Min. 1 Debit & 1 Credit required
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{createEntry.isPending ? 'Creating...' : 'Create Entry'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
