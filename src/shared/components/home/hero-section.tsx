'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { Button } from '@src/shared/components/ui/button';
import { Badge } from '@src/shared/components/ui/badge';
import { Text } from '@src/shared/components/ui/text';

const HERO_DESCRIPTION = [
  'A unified DPDP Compliant platform for Meghalaya Finance Service Association.',
  'Manage memberships, meetings, finances, compliances and trainings with robust security features.',
  'Designed to allow other service Association to adopt the platform and onboard activities on plug and play mode.',
];

export function HeroSection() {
  return (
    <section className="relative mt-16 flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-primary/2 via-background to-background" />
      <div className="absolute -left-32 top-1/4 size-125 rounded-full bg-primary/4 blur-3xl" />
      <div className="absolute -bottom-32 right-1/4 size-400 rounded-full bg-primary/2 blur-3xl" />
      <div className="absolute inset-0 bg-[image:radial-gradient(var(--border)_0.5px,transparent_0.5px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_20%,transparent_70%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-16 px-6 py-24 lg:flex-row lg:py-32">
        <div className="max-w-xl text-center lg:w-3/5 lg:text-left">
          <Badge variant="default" className="mb-5 justify-center lg:justify-start">
            MFSA Connect Platform
          </Badge>
          <Text variant="display-lg" asChild className="mb-6">
            <h1>
              Meghalaya&nbsp;
              <span className="text-primary">Finance Service</span>
              &nbsp;Association
            </h1>
          </Text>
          <ul className="mb-8 space-y-4">
            {HERO_DESCRIPTION.map((description, index) => (
              <li key={index} className="flex items-start gap-3 lg:items-center">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="mt-0.5 size-5 shrink-0 text-primary lg:mt-0"
                />
                <Text variant="body-md" className="text-foreground/80">
                  {description}
                </Text>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Button asChild variant="default" size="lg">
              <Link href="/dashboard">
                Get Started
                <HugeiconsIcon icon={ArrowRight01Icon} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>
        </div>
        <div className="shrink-0 lg:w-2/5">
          <div className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center">
            <div className="relative flex size-full items-center justify-center p-8">
              <img
                src="/assets/images/logo/logo-2.jpeg"
                alt="Logo"
                className="h-full w-full rounded-xl object-contain mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
