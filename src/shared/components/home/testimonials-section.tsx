'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { StarIcon } from '@hugeicons/core-free-icons';
import { Badge } from '@src/shared/components/ui/badge';
import {
  Card,
  CardContent,
} from '@src/shared/components/ui/card';
import { Text } from '@src/shared/components/ui/text';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@src/shared/components/ui/carousel';
import { Avatar, AvatarFallback } from '@src/shared/components/ui/avatar';

const TESTIMONIALS = [
  {
    quote:
      'MFSA Connect transformed how we manage our association. The financial ledger alone saved us countless hours of manual bookkeeping.',
    name: 'Rajesh Sharma',
    designation: 'Secretary, MFSA',
    initials: 'RS',
  },
  {
    quote:
      'The meeting governance module is a game-changer. Scheduling, agenda management, and minutes recording are now seamless.',
    name: 'Priya Das',
    designation: 'President, MPSA',
    initials: 'PD',
  },
  {
    quote:
      'Knowing our member data is DPDP-compliant gives us peace of mind. The consent management and DSAR workflows are exceptional.',
    name: 'Anil Verma',
    designation: 'Finance Officer, MFSA',
    initials: 'AV',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-muted/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <Badge variant="default" className="mb-4 justify-center">
            Testimonials
          </Badge>
          <Text variant="display-lg" asChild>
            <h2 className="mb-4">Trusted by Association Leaders</h2>
          </Text>
          <Text variant="body-md" color="muted" asChild>
            <p className="mx-auto max-w-2xl">
              Hear from the administrators and members who use MFSA Connect every day.
            </p>
          </Text>
        </div>

        <Carousel className="mx-auto max-w-4xl">
          <CarouselContent>
            {TESTIMONIALS.map((testimonial) => (
              <CarouselItem key={testimonial.name}>
                <Card className="mx-auto max-w-2xl text-center">
                  <CardContent className="py-12">
                    <div className="mb-6 flex justify-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <HugeiconsIcon
                          key={i}
                          icon={StarIcon}
                          className="size-4 text-accent-yellow"
                        />
                      ))}
                    </div>
                    <Text variant="title-md" color="body" asChild>
                      <p className="mb-8 leading-relaxed italic">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>
                    </Text>
                    <Avatar size="lg" className="mx-auto mb-3">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <Text variant="title-sm" asChild>
                      <p className="mb-1">{testimonial.name}</p>
                    </Text>
                    <Text variant="caption" color="muted">
                      {testimonial.designation}
                    </Text>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
}
