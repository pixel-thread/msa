'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserIdVerificationIcon,
  BankIcon,
  UserGroupIcon,
  Payment01Icon,
  ShieldBlockchainIcon,
  BookOpen01Icon,
} from '@hugeicons/core-free-icons';
import { Badge } from '@src/shared/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@src/shared/components/ui/card';
import { Text } from '@src/shared/components/ui/text';

const FEATURES = [
  {
    icon: UserIdVerificationIcon,
    title: 'Digital Membership',
    description:
      'End-to-end member lifecycle management with role-based access, onboarding workflows, and automated renewals.',
  },
  {
    icon: BankIcon,
    title: 'Financial Ledger',
    description:
      'Full double-entry accounting system with cashbook, general ledger, receivables, and auto-generated financial reports.',
  },
  {
    icon: UserGroupIcon,
    title: 'Meeting Governance',
    description:
      'Schedule EC and general meetings, assign attendees, manage agenda items, record minutes, and issue formal notices.',
  },
  {
    icon: Payment01Icon,
    title: 'Subscription Engine',
    description:
      'Configurable subscription plans with automated billing, payment tracking, receipt generation, and waiver management.',
  },
  {
    icon: ShieldBlockchainIcon,
    title: 'DPDP Act Compliance',
    description:
      'Built-in consent management, DSAR ticketing with 21-day SLA, data retention enforcement, and full audit trails.',
  },
  {
    icon: BookOpen01Icon,
    title: 'Training Modules',
    description:
      'Create and assign compliance training, track completions, and maintain certification records for all members.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <Badge variant="default" className="mb-4 justify-center">
            Platform Capabilities
          </Badge>
          <Text variant="display-lg" asChild>
            <h2 className="mb-4">Everything You Need</h2>
          </Text>
          <Text variant="body-md" color="muted" asChild>
            <p className="mx-auto max-w-2xl">
              From membership management to financial accounting and DPDP compliance, MFSA Connect
              provides a complete governance toolkit.
            </p>
          </Text>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              size="sm"
              className="group transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center bg-primary/10 text-primary">
                  <HugeiconsIcon icon={feature.icon} className="size-5" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
