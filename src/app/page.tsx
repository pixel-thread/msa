"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIdVerificationIcon,
  BankIcon,
  UserGroupIcon,
  Payment01Icon,
  ShieldBlockchainIcon,
  BookOpen01Icon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  MailSend01Icon,
  PhoneCheckIcon,
  MapPinIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@src/shared/components/ui/button";
import { Badge } from "@src/shared/components/ui/badge";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@src/shared/components/ui/card";
import { Input } from "@src/shared/components/ui/input";
import { Textarea } from "@src/shared/components/ui/textarea";
import { Text } from "@src/shared/components/ui/text";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@src/shared/components/ui/carousel";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import { PublicHeader } from "@src/shared/components/public-header";
import { PublicFooter } from "@src/shared/components/public-footer";

const FEATURES = [
  {
    icon: UserIdVerificationIcon,
    title: "Digital Membership",
    description:
      "End-to-end member lifecycle management with role-based access, onboarding workflows, and automated renewals.",
  },
  {
    icon: BankIcon,
    title: "Financial Ledger",
    description:
      "Full double-entry accounting system with cashbook, general ledger, receivables, and auto-generated financial reports.",
  },
  {
    icon: UserGroupIcon,
    title: "Meeting Governance",
    description:
      "Schedule EC and general meetings, assign attendees, manage agenda items, record minutes, and issue formal notices.",
  },
  {
    icon: Payment01Icon,
    title: "Subscription Engine",
    description:
      "Configurable subscription plans with automated billing, payment tracking, receipt generation, and waiver management.",
  },
  {
    icon: ShieldBlockchainIcon,
    title: "DPDP Act Compliance",
    description:
      "Built-in consent management, DSAR ticketing with 21-day SLA, data retention enforcement, and full audit trails.",
  },
  {
    icon: BookOpen01Icon,
    title: "Training Modules",
    description:
      "Create and assign compliance training, track completions, and maintain certification records for all members.",
  },
];

const STATS = [
  { value: "500+", label: "Active Members" },
  { value: "3", label: "Associations" },
  { value: "15+", label: "Years of Service" },
  { value: "99.9%", label: "Uptime" },
];

const STEPS = [
  {
    number: "01",
    title: "Sign Up",
    description:
      "Create your account with email and password. Enable MFA for an extra layer of security.",
  },
  {
    number: "02",
    title: "Complete Profile",
    description:
      "Fill in your membership details, designation, and joining dates. Your data is encrypted at rest.",
  },
  {
    number: "03",
    title: "Get Started",
    description:
      "Access your dashboard, manage subscriptions, view meetings, and participate in governance.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "MFSA Connect transformed how we manage our association. The financial ledger alone saved us countless hours of manual bookkeeping.",
    name: "Rajesh Sharma",
    designation: "Secretary, MFSA",
    initials: "RS",
  },
  {
    quote:
      "The meeting governance module is a game-changer. Scheduling, agenda management, and minutes recording are now seamless.",
    name: "Priya Das",
    designation: "President, MPSA",
    initials: "PD",
  },
  {
    quote:
      "Knowing our member data is DPDP-compliant gives us peace of mind. The consent management and DSAR workflows are exceptional.",
    name: "Anil Verma",
    designation: "Finance Officer, MFSA",
    initials: "AV",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      {/* ─── HERO ─── */}
      <section className="relative mt-16 flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          <Badge
            variant="default"
            className="mb-6 justify-center text-[0.625rem]"
          >
            Security-First Platform
          </Badge>
          <Text variant="display-lg" asChild className="mb-6">
            <h1>
              Meghalaya&nbsp;
              <span className="text-primary">Finance Service</span>
              &nbsp;Association
            </h1>
          </Text>
          <Text
            variant="title-lg"
            color="muted"
            asChild
            className="mx-auto mb-10 max-w-2xl"
          >
            <p>
              A unified, DPDP-compliant platform for Meghalaya Finance Service
              Association and affiliated bodies. Manage memberships, meetings,
              financial ledgers, and compliance with zero compromise on
              security.
            </p>
          </Text>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild variant="default" size="lg">
              <Link href="/sign-up">
                Get Started
                <HugeiconsIcon icon={ArrowRight01Icon} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <Text variant="display-md" color="primary" asChild>
                  <p className="mb-1">{stat.value}</p>
                </Text>
                <Text
                  variant="caption-strong"
                  color="muted"
                  transform="uppercase"
                >
                  {stat.label}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
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
                From membership management to financial accounting and DPDP
                compliance, MFSA Connect provides a complete governance toolkit.
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

      {/* ─── ABOUT ─── */}
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
                  The Meghalaya Finance Service Association (MFSA) is a
                  government-affiliated body representing finance service
                  professionals across the state of Meghalaya, North-East India.
                </p>
              </Text>
              <Text variant="body-md" color="body" asChild>
                <p className="mb-6 leading-relaxed">
                  MFSA Connect is our digital transformation initiative —
                  designed to bring transparency, efficiency, and
                  enterprise-grade security to association governance. The
                  platform serves multiple associations including MPSA, with
                  full data isolation and compliance with the Digital Personal
                  Data Protection (DPDP) Act 2023.
                </p>
              </Text>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className="size-4 text-semantic-up"
                  />
                  <Text variant="body-sm">DPDP Act 2023 Compliant</Text>
                </div>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className="size-4 text-semantic-up"
                  />
                  <Text variant="body-sm">AES-256-GCM Encryption</Text>
                </div>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className="size-4 text-semantic-up"
                  />
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
                  <Text
                    variant="caption-strong"
                    transform="uppercase"
                    color="muted"
                  >
                    Years Experience
                  </Text>
                </CardContent>
              </Card>
              <Card size="sm" className="text-center">
                <CardContent className="py-8">
                  <Text variant="display-sm" color="primary" asChild>
                    <p className="mb-2">500+</p>
                  </Text>
                  <Text
                    variant="caption-strong"
                    transform="uppercase"
                    color="muted"
                  >
                    Active Members
                  </Text>
                </CardContent>
              </Card>
              <Card size="sm" className="text-center">
                <CardContent className="py-8">
                  <Text variant="display-sm" color="primary" asChild>
                    <p className="mb-2">3</p>
                  </Text>
                  <Text
                    variant="caption-strong"
                    transform="uppercase"
                    color="muted"
                  >
                    Associations
                  </Text>
                </CardContent>
              </Card>
              <Card size="sm" className="text-center">
                <CardContent className="py-8">
                  <Text variant="display-sm" color="primary" asChild>
                    <p className="mb-2">100%</p>
                  </Text>
                  <Text
                    variant="caption-strong"
                    transform="uppercase"
                    color="muted"
                  >
                    Data Protection
                  </Text>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
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
                Join your association in three simple steps and unlock the full
                power of digital governance.
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

      {/* ─── TESTIMONIALS ─── */}
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
                Hear from the administrators and members who use MFSA Connect
                every day.
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

      {/* ─── SECURITY & COMPLIANCE ─── */}
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
                Every feature is designed with security and regulatory
                compliance at its core. Your data is protected at every layer.
              </p>
            </Text>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ShieldBlockchainIcon,
                title: "DPDP Act 2023",
                description:
                  "Full compliance with India's Digital Personal Data Protection Act — consent receipts, DSAR workflows, and 7-year retention enforcement.",
              },
              {
                icon: BankIcon,
                title: "AES-256-GCM Encryption",
                description:
                  "All personally identifiable information is encrypted at rest using AES-256-GCM before it touches the database.",
              },
              {
                icon: UserIdVerificationIcon,
                title: "Role-Based Access Control",
                description:
                  "Granular permissions across six roles — super_admin, president, secretary, finance, DPO, and member.",
              },
              {
                icon: CheckmarkBadge01Icon,
                title: "Complete Audit Trail",
                description:
                  "Every mutation is logged with actor, timestamp, and association scope in an immutable audit trail.",
              },
              {
                icon: Payment01Icon,
                title: "Rate Limiting & MFA",
                description:
                  "Redis-backed rate limiting and email-based multi-factor authentication protect against abuse.",
              },
              {
                icon: BookOpen01Icon,
                title: "Data Retention & Anonymization",
                description:
                  "Automatic data anonymization after 7-year retention period. Daily cron enforcement at 02:00.",
              },
            ].map((item) => (
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

      {/* ─── CTA BANNER ─── */}
      <section className="bg-primary py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Text variant="display-md" color="on-primary" asChild>
            <h2 className="mb-6">Ready to Transform Your Association?</h2>
          </Text>
          <Text
            variant="title-md"
            color="on-primary"
            className="mb-10 opacity-80"
            asChild
          >
            <p className="mx-auto max-w-2xl">
              Join hundreds of finance service professionals already using MFSA
              Connect for secure, compliant association governance.
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

      {/* ─── CONTACT ─── */}
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
                Have questions or want to learn more? Reach out to our team and
                we will get back to you promptly.
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
                <Textarea
                  id="message"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>
              <Button variant="default" className="w-full">
                Send Message
                <HugeiconsIcon icon={ArrowRight01Icon} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
