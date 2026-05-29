'use client';

import { useDsarSlaReport } from '../hooks';

export function DsarSlaCards() {
  const { report, isLoading } = useDsarSlaReport();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className=" border border-border bg-card p-5 animate-pulse">
            <div className="h-4 w-20 bg-muted mb-3" />
            <div className="h-8 w-12 bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Breached',
      value: report?.breached ?? 0,
      bg: 'bg-[#FEF3F2]',
      text: 'text-[#B42318]',
      border: 'border-[#FECDCA]',
      label: 'Past deadline',
    },
    {
      title: 'At Risk',
      value: report?.atRisk ?? 0,
      bg: 'bg-[#FFFAEB]',
      text: 'text-[#B54708]',
      border: 'border-[#FEDF89]',
      label: 'Due within 3 days',
    },
    {
      title: 'On Track',
      value: report?.onTrack ?? 0,
      bg: 'bg-[#ECFDF3]',
      text: 'text-[#067647]',
      border: 'border-[#ABEFC6]',
      label: 'More than 3 days',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.title} className={` border ${card.border} ${card.bg} p-5`}>
          <p className="text-sm font-medium text-body">{card.title}</p>
          <p className={`text-[32px] font-semibold leading-tight mt-1 ${card.text}`}>
            {card.value}
          </p>
          <p className="text-xs text-body mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
