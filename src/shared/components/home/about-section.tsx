'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Badge } from '@src/shared/components/ui/badge';
import {
  Card,
  CardContent,
} from '@src/shared/components/ui/card';
import { Text } from '@src/shared/components/ui/text';

export function AboutSection() {
  return (
    <section id="about" className="bg-muted/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <Badge variant="default" className="mb-4">
              About Us
            </Badge>
            <Text variant="display-lg" asChild>
              <h2 className="mb-6">Meghalaya Finance Service Association</h2>
            </Text>
            <Text variant="body-md" color="body" asChild>
              <p className="mb-4 leading-relaxed">
                The Meghalaya Finance Service Association (MFSA) is a government-affiliated body
                representing finance service professionals across the state of Meghalaya,
                North-East India.
              </p>
            </Text>
            <Text variant="body-md" color="body" asChild>
              <p className="mb-6 leading-relaxed">
                MFSA Connect is our digital transformation initiative — designed to bring
                transparency, efficiency, and enterprise-grade security to association governance.
                The platform serves multiple associations including MPSA, with full data isolation
                and compliance with the Digital Personal Data Protection (DPDP) Act 2023.
              </p>
            </Text>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-semantic-up" />
                <Text variant="body-sm">DPDP Act 2023 Compliant</Text>
              </div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-semantic-up" />
                <Text variant="body-sm">AES-256-GCM Encryption</Text>
              </div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-semantic-up" />
                <Text variant="body-sm">Multi-Association Support</Text>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card size="sm" className="text-center">
              <CardContent className="py-8">
                <Text variant="display-sm" color="primary" asChild>
                  <p className="mb-2">15+</p>
                </Text>
                <Text variant="caption-strong" transform="uppercase" color="muted">
                  Years Experience
                </Text>
              </CardContent>
            </Card>
            <Card size="sm" className="text-center">
              <CardContent className="py-8">
                <Text variant="display-sm" color="primary" asChild>
                  <p className="mb-2">500+</p>
                </Text>
                <Text variant="caption-strong" transform="uppercase" color="muted">
                  Active Members
                </Text>
              </CardContent>
            </Card>
            <Card size="sm" className="text-center">
              <CardContent className="py-8">
                <Text variant="display-sm" color="primary" asChild>
                  <p className="mb-2">3</p>
                </Text>
                <Text variant="caption-strong" transform="uppercase" color="muted">
                  Associations
                </Text>
              </CardContent>
            </Card>
            <Card size="sm" className="text-center">
              <CardContent className="py-8">
                <Text variant="display-sm" color="primary" asChild>
                  <p className="mb-2">100%</p>
                </Text>
                <Text variant="caption-strong" transform="uppercase" color="muted">
                  Data Protection
                </Text>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
