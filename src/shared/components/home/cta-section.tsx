'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@src/shared/components/ui/button';
import { Text } from '@src/shared/components/ui/text';

export function CtaSection() {
  return (
    <section className="bg-primary py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Text variant="display-md" color="on-primary" asChild>
          <h2 className="mb-6">Ready to Transform Your Association?</h2>
        </Text>
        <Text variant="title-md" color="on-primary" className="mb-10 opacity-80" asChild>
          <p className="mx-auto max-w-2xl">
            Join hundreds of finance service professionals already using MFSA Connect for secure,
            compliant association governance.
          </p>
        </Text>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="bg-white text-primary hover:bg-white/90"
          >
            <Link href="/sign-up">
              Get Started Today
              <HugeiconsIcon icon={ArrowRight01Icon} />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            <Link href="#contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
