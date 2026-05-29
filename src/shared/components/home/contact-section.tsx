'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import {
  MailSend01Icon,
  PhoneCheckIcon,
  MapPinIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';
import { Textarea } from '@src/shared/components/ui/textarea';
import { Text } from '@src/shared/components/ui/text';

export function ContactSection() {
  return (
    <section id="contact" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <Badge variant="default" className="mb-4 justify-center">
            Get In Touch
          </Badge>
          <Text variant="display-lg" asChild>
            <h2 className="mb-4">Contact Us</h2>
          </Text>
          <Text variant="body-md" color="muted" asChild>
            <p className="mx-auto max-w-2xl">
              Have questions or want to learn more? Reach out to our team and we will get back to
              you promptly.
            </p>
          </Text>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <div className="mb-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
                  <HugeiconsIcon icon={MailSend01Icon} className="size-5" />
                </div>
                <div>
                  <Text variant="title-sm" asChild>
                    <p className="mb-1">Email</p>
                  </Text>
                  <Text variant="body-sm" color="muted">
                    contact@mfsa.org
                  </Text>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
                  <HugeiconsIcon icon={PhoneCheckIcon} className="size-5" />
                </div>
                <div>
                  <Text variant="title-sm" asChild>
                    <p className="mb-1">Phone</p>
                  </Text>
                  <Text variant="body-sm" color="muted">
                    +91 XXX XXX XXXX
                  </Text>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
                  <HugeiconsIcon icon={MapPinIcon} className="size-5" />
                </div>
                <div>
                  <Text variant="title-sm" asChild>
                    <p className="mb-1">Address</p>
                  </Text>
                  <Text variant="body-sm" color="muted">
                    Shillong, Meghalaya, India
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs font-semibold tracking-widest uppercase text-foreground"
                >
                  Name
                </label>
                <Input id="name" placeholder="Your name" />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold tracking-widest uppercase text-foreground"
                >
                  Email
                </label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
            </div>
            <div>
              <label
                htmlFor="subject"
                className="mb-1.5 block text-xs font-semibold tracking-widest uppercase text-foreground"
              >
                Subject
              </label>
              <Input id="subject" placeholder="How can we help?" />
            </div>
            <div>
              <label
                htmlFor="message"
                className="mb-1.5 block text-xs font-semibold tracking-widest uppercase text-foreground"
              >
                Message
              </label>
              <Textarea id="message" placeholder="Tell us more about your inquiry..." />
            </div>
            <Button variant="default" className="w-full">
              Send Message
              <HugeiconsIcon icon={ArrowRight01Icon} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
