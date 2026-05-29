'use client';

import { Badge } from '@src/shared/components/ui/badge';
import { Text } from '@src/shared/components/ui/text';

const STEPS = [
  {
    number: '01',
    title: 'Sign Up',
    description:
      'Create your account with email and password. Enable MFA for an extra layer of security.',
  },
  {
    number: '02',
    title: 'Complete Profile',
    description:
      'Fill in your membership details, designation, and joining dates. Your data is encrypted at rest.',
  },
  {
    number: '03',
    title: 'Get Started',
    description:
      'Access your dashboard, manage subscriptions, view meetings, and participate in governance.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <Badge variant="default" className="mb-4 justify-center">
            Getting Started
          </Badge>
          <Text variant="display-lg" asChild>
            <h2 className="mb-4">How It Works</h2>
          </Text>
          <Text variant="body-md" color="muted" asChild>
            <p className="mx-auto max-w-2xl">
              Join your association in three simple steps and unlock the full power of digital
              governance.
            </p>
          </Text>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center bg-primary text-primary-foreground">
                <Text variant="title-lg" className="font-bold">
                  {step.number}
                </Text>
              </div>
              <Text variant="title-md" asChild>
                <h3 className="mb-3">{step.title}</h3>
              </Text>
              <Text variant="body-sm" color="muted" asChild>
                <p>{step.description}</p>
              </Text>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
