'use client';

import { useMemo } from 'react';
import { useComplianceChecks } from '../hooks/useComplianceChecks';
import { Skeleton } from '@src/shared/components/ui/skeleton';
import { ALL_CHECK_TYPES } from '../validators/compliance';

const checkTypeLabels: Record<string, string> = {
  CONSENT_COVERAGE: 'Consent',
  DSAR_SLA_COMPLIANCE: 'DSAR SLA',
  DATA_RETENTION: 'Data Retention',
  PII_ENCRYPTION: 'PII Encryption',
  SUBSCRIPTION_EXPIRY: 'Subscriptions',
  MEMBER_DATA_COMPLETENESS: 'Member Data',
  PAYMENT_RECONCILIATION: 'Payments',
  AUDIT_LOG_INTEGRITY: 'Audit Logs',
};

const statusColors: Record<string, string> = {
  PASSED: 'text-[#067647]',
  FAILED: 'text-[#B42318]',
  WARNING: 'text-[#B54708]',
  SKIPPED: 'text-[#344054]',
};

const statusBg: Record<string, string> = {
  PASSED: 'bg-[#ECFDF3]',
  FAILED: 'bg-[#FEF3F2]',
  WARNING: 'bg-[#FFFAEB]',
  SKIPPED: 'bg-[#F2F4F7]',
};

export function ComplianceStatusCards() {
  const { checks, isLoading } = useComplianceChecks({ limit: 100 });

  const latestPerType = useMemo(() => {
    const latestMap = new Map<string, (typeof checks)[0]>();
    for (const check of checks) {
      const existing = latestMap.get(check.checkType);
      if (!existing || new Date(check.checkedAt) > new Date(existing.checkedAt)) {
        latestMap.set(check.checkType, check);
      }
    }
    return latestMap;
  }, [checks]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {ALL_CHECK_TYPES.map((type) => {
        const latest = latestPerType.get(type);
        return (
          <div key={type} className=" border border-border bg-card p-4">
            <p className="text-xs font-medium text-body uppercase tracking-wider">
              {checkTypeLabels[type] || type.replace(/_/g, ' ')}
            </p>
            {latest ? (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 ${statusBg[latest.status] || 'bg-gray-300'}`}
                />
                <span
                  className={`text-sm font-semibold ${statusColors[latest.status] || 'text-ink'}`}
                >
                  {latest.status}
                </span>
                <span className="text-xs text-body ml-auto">{latest.score}%</span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-body">No checks yet</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
