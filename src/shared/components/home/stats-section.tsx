'use client';

import { Text } from '@src/shared/components/ui/text';

const STATS = [
  { value: '500+', label: 'Active Members' },
  { value: '3', label: 'Associations' },
  { value: '15+', label: 'Years of Service' },
  { value: '99.9%', label: 'Uptime' },
];

export function StatsSection() {
  return (
    <section className="border-y border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <Text variant="display-md" color="primary" asChild>
                <p className="mb-1">{stat.value}</p>
              </Text>
              <Text variant="caption-strong" color="muted" transform="uppercase">
                {stat.label}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
