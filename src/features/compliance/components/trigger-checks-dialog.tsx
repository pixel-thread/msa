'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@src/shared/components/ui/dialog';
import { Button } from '@src/shared/components/ui/button';
import { Checkbox } from '@src/shared/components/ui/checkbox';
import { Label } from '@src/shared/components/ui/label';
import { Play } from 'lucide-react';
import { useTriggerComplianceCheck } from '../hooks/useTriggerComplianceCheck';
import { ALL_CHECK_TYPES } from '../validators/compliance';

const checkTypeLabels: Record<string, string> = {
  CONSENT_COVERAGE: 'Consent Coverage',
  DSAR_SLA_COMPLIANCE: 'DSAR SLA Compliance',
  DATA_RETENTION: 'Data Retention',
  PII_ENCRYPTION: 'PII Encryption',
  SUBSCRIPTION_EXPIRY: 'Subscription Expiry',
  MEMBER_DATA_COMPLETENESS: 'Member Data Completeness',
  PAYMENT_RECONCILIATION: 'Payment Reconciliation',
  AUDIT_LOG_INTEGRITY: 'Audit Log Integrity',
};

export function TriggerChecksDialog() {
  const [open, setOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const triggerChecks = useTriggerComplianceCheck();

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleAll = () => {
    setSelectedTypes((prev) =>
      prev.length === ALL_CHECK_TYPES.length ? [] : [...ALL_CHECK_TYPES],
    );
  };

  const handleRun = () => {
    const types = selectedTypes.length > 0 ? selectedTypes : ALL_CHECK_TYPES;
    triggerChecks.mutate(types, {
      onSuccess: () => {
        setOpen(false);
        setSelectedTypes([]);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Play className="h-4 w-4 mr-2" />
          Run Compliance Checks
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Run Compliance Checks</DialogTitle>
          <DialogDescription>
            Select the compliance checks to run. All checks run by default if none are selected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectedTypes.length === ALL_CHECK_TYPES.length}
              onCheckedChange={toggleAll}
            />
            <Label htmlFor="select-all" className="font-medium text-sm">
              Select All
            </Label>
          </div>
          <div className="border-t" />
          {ALL_CHECK_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <Checkbox
                id={type}
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => toggleType(type)}
              />
              <Label htmlFor={type} className="text-sm cursor-pointer">
                {checkTypeLabels[type] || type.replace(/_/g, ' ')}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={triggerChecks.isPending}>
            {triggerChecks.isPending
              ? 'Running...'
              : `Run${selectedTypes.length > 0 ? ' Selected' : ' All'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
