'use client';

import { useConsentReport } from '../hooks/useConsentReport';
import { Skeleton } from '@src/shared/components/ui/skeleton';
import { ConsentPurpose } from '@prisma/client';

const purposeLabels: Record<ConsentPurpose, string> = {
  PAYMENTS: 'Payments',
  COMMUNICATIONS: 'Communications',
  MEETINGS: 'Meetings',
  ANALYTICS: 'Analytics',
  MARKETING: 'Marketing',
};

export function ConsentReportCards() {
  const { report, isLoading } = useConsentReport();

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {report.map((item) => (
        <div key={item.purpose} className=" border w-full border-border bg-card p-4">
          <p className="text-xs font-medium text-body uppercase tracking-wider">
            {purposeLabels[item.purpose as ConsentPurpose] || item.purpose}
          </p>
          <div className="mt-3 flex w-full items-baseline gap-3">
            <div className="w-full">
              <p className="text-lg font-semibold text-[#067647]">{item.grantedCount}</p>
              <p className="text-xs text-body">Granted</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-[#B42318]">{item.withdrawnCount}</p>
              <p className="text-xs text-body">Withdrawn</p>
            </div>
          </div>
          <p className="mt-1 text-xs text-body">{item.totalCount} total</p>
        </div>
      ))}
    </div>
  );
}
