"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Label } from "@src/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { Textarea } from "@src/shared/components/ui/textarea";
import { useCreateEntry } from "../hooks/useCreateEntry";
import { useLedgerAccounts } from "../hooks/useLedgerAccounts";
import { Plus, X } from "lucide-react";

interface CreateEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LineInput {
  debitAccountId: string;
  amount: string;
}

export function CreateEntryDialog({
  open,
  onOpenChange,
}: CreateEntryDialogProps) {
  const { accounts } = useLedgerAccounts();
  const createEntry = useCreateEntry();
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineInput[]>([
    { debitAccountId: "", amount: "" },
  ]);

  const addLine = () => {
    setLines([...lines, { debitAccountId: "", amount: "" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof LineInput, value: string) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const resetForm = () => {
    setDescription("");
    setLines([{ debitAccountId: "", amount: "" }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    const validLines = lines.filter(
      (l) => l.debitAccountId && l.amount && parseFloat(l.amount) > 0,
    );
    if (validLines.length === 0) return;

    createEntry.mutate(
      {
        description,
        lines: validLines.map((l) => ({
          debitAccountId: l.debitAccountId,
          amount: parseFloat(l.amount),
        })),
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Ledger Entry</DialogTitle>
          <DialogDescription>
            Create a new double-entry ledger transaction
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
                placeholder="Enter description for this entry"
                rows={2}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ledger Lines</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLine}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Line
                </Button>
              </div>

              {lines.map((line, index) => (
                <div
                  key={index}
                  className="flex items-end gap-2 border border-hairline p-3"
                >
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Account</Label>
                    <Select
                      value={line.debitAccountId}
                      onValueChange={(v) =>
                        updateLine(index, "debitAccountId", v)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.code} - {account.name}
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
                      min="0"
                      value={line.amount}
                      onChange={(e) =>
                        updateLine(index, "amount", e.target.value)
                      }
                      placeholder="0.00"
                      className="h-9"
                      required
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => removeLine(index)}
                    disabled={lines.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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
            <Button
              type="submit"
              disabled={createEntry.isPending || !description.trim()}
            >
              {createEntry.isPending ? "Creating..." : "Create Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
