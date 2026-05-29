'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import {
  ShieldBlockchainIcon,
  BankIcon,
  UserIdVerificationIcon,
  CheckmarkBadge01Icon,
  Payment01Icon,
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

const SECURITY_ITEMS = [
  {
    icon: ShieldBlockchainIcon,
    title: 'DPDP Act 2023',
    description:
      "Full compliance with India's Digital Personal Data Protection Act — consent receipts, DSAR workflows, and 7-year retention enforcement.",
  },
  {
    icon: BankIcon,
    title: 'AES-256-GCM Encryption',
    description:
      'All personally identifiable information is encrypted at rest using AES-256-GCM before it touches the database.',
  },
  {
    icon: UserIdVerificationIcon,
    title: 'Role-Based Access Control',
    description:
      'Granular permissions across six roles — super_admin, president, secretary, finance, DPO, and member.',
  },
  {
    icon: CheckmarkBadge01Icon,
    title: 'Complete Audit Trail',
    description:
      'Every mutation is logged with actor, timestamp, and association scope in an immutable audit trail.',
  },
  {
    icon: Payment01Icon,
    title: 'Rate Limiting & MFA',
    description:
      'Redis-backed rate limiting and email-based multi-factor authentication protect against abuse.',
  },
  {
    icon: BookOpen01Icon,
    title: 'Data Retention & Anonymization',
    description:
      'Automatic data anonymization after 7-year retention period. Daily cron enforcement at 02:00.',
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <Badge variant="default" className="mb-4 justify-center">
            Enterprise Security
          </Badge>
          <Text variant="display-lg" asChild>
            <h2 className="mb-4">Built for Compliance</h2>
          </Text>
          <Text variant="body-md" color="muted" asChild>
            <p className="mx-auto max-w-2xl">
              Every feature is designed with security and regulatory compliance at its core. Your
              data is protected at every layer.
            </p>
          </Text>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SECURITY_ITEMS.map((item) => (
            <Card key={item.title} size="sm">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center bg-semantic-up/10 text-semantic-up">
                  <HugeiconsIcon icon={item.icon} className="size-5" />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
