'use client';

import { PublicHeader } from '@src/shared/components/public-header';
import { PublicFooter } from '@src/shared/components/public-footer';
import { HeroSection } from '@src/shared/components/home/hero-section';
import { StatsSection } from '@src/shared/components/home/stats-section';
import { FeaturesSection } from '@src/shared/components/home/features-section';
import { AboutSection } from '@src/shared/components/home/about-section';
import { HowItWorksSection } from '@src/shared/components/home/how-it-works-section';
import { TestimonialsSection } from '@src/shared/components/home/testimonials-section';
import { SecuritySection } from '@src/shared/components/home/security-section';
import { CtaSection } from '@src/shared/components/home/cta-section';
import { ContactSection } from '@src/shared/components/home/contact-section';

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <AboutSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <SecuritySection />
      <CtaSection />
      <ContactSection />
      <PublicFooter />
    </div>
  );
}
