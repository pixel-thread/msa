'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserIdVerificationIcon,
  BankIcon,
  UserGroupIcon,
  ShieldBlockchainIcon,
  BookOpen01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';

import { Button } from '@src/shared/components/ui/button';
import { Badge } from '@src/shared/components/ui/badge';
import { Input } from '@src/shared/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@src/shared/components/ui/card';
import { Alert, AlertDescription } from '@src/shared/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@src/shared/components/ui/form';
import { Text } from '@src/shared/components/ui/text';
import { PublicHeader } from '@src/shared/components/public-header';
import { PublicFooter } from '@src/shared/components/public-footer';
import {
  MembershipApplicationSchema,
  type MembershipApplicationInput,
} from '@src/features/membership-applications/validators';
import { useSignUp } from '@src/features/auth/hooks';
import { logger } from '@src/shared/logger';
import { env } from '@src/env';

const BENEFITS = [
  {
    icon: UserIdVerificationIcon,
    title: 'Digital Membership',
    description:
      'Complete member lifecycle management with role-based access and automated renewals.',
  },
  {
    icon: BankIcon,
    title: 'Financial Transparency',
    description:
      'Access to full double-entry accounting, cashbook, and automated financial reports.',
  },
  {
    icon: UserGroupIcon,
    title: 'Governance Participation',
    description: 'Attend EC and general meetings, vote on agenda items, and access minutes.',
  },
  {
    icon: ShieldBlockchainIcon,
    title: 'Data Protection',
    description: 'Your personal data is protected under DPDP Act 2023 with AES-256 encryption.',
  },
  {
    icon: BookOpen01Icon,
    title: 'Compliance Training',
    description: 'Access training modules, track completions, and maintain certification records.',
  },
];

export default function SignUpPage() {
  const signUpMutation = useSignUp();

  const form = useForm({
    resolver: zodResolver(MembershipApplicationSchema),
    defaultValues: {
      email: '',
      phone: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: 18,
      gender: 'MALE',
      address: '',
      city: '',
      state: '',
      country: 'IN',
      postalCode: '',
      associationSlug: env.NEXT_PUBLIC_ASSOCIATION_SLUG,
    },
  });

  const onSubmit = async (values: MembershipApplicationInput) => {
    try {
      await signUpMutation.mutateAsync(values);
    } catch {}
  };

  logger.debug('signUpMutation', form.formState.errors);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <div className="flex flex-1 flex-col md:flex-row pt-16">
        <div className="hidden md:flex md:w-1/2 flex-col justify-center px-12 lg:px-16 bg-muted/30">
          <div className="mx-auto max-w-md">
            <Badge variant="default" className="mb-6">
              Become a Member
            </Badge>
            <Text variant="display-md" asChild>
              <h1 className="mb-6">Join Your Association</h1>
            </Text>
            <Text variant="body-md" color="muted" asChild>
              <p className="mb-10 leading-relaxed">
                Become part of a trusted network of finance service professionals. Manage your
                membership, access financial tools, and participate in association governance — all
                in one place.
              </p>
            </Text>

            <div className="space-y-6">
              {BENEFITS.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
                    <HugeiconsIcon icon={benefit.icon} className="size-5" />
                  </div>
                  <div>
                    <Text variant="title-sm" asChild>
                      <p className="mb-1">{benefit.title}</p>
                    </Text>
                    <Text variant="body-sm" color="muted">
                      {benefit.description}
                    </Text>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 space-y-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="size-4 shrink-0 text-semantic-up"
                />
                <Text variant="body-sm" color="muted">
                  DPDP Act 2023 Compliant
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="size-4 shrink-0 text-semantic-up"
                />
                <Text variant="body-sm" color="muted">
                  AES-256-GCM Encryption at Rest
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="size-4 shrink-0 text-semantic-up"
                />
                <Text variant="body-sm" color="muted">
                  7-Year Data Retention & Auto-Anonymization
                </Text>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-center px-6 py-24 md:w-1/2">
          <Card className="w-full max-w-lg">
            <CardHeader className="space-y-3">
              <CardTitle className="font-heading text-2xl font-bold tracking-wider uppercase">
                Membership Application
              </CardTitle>
              <CardDescription>Fill in your details to apply for membership</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {signUpMutation.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {signUpMutation.error?.message || 'Application failed'}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value as string}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Age"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <select
                            className="h-10 w-full border-0 border-b border-b-input bg-transparent px-0 py-1 text-base transition-[color,border-color] outline-none focus-visible:border-b-ring md:text-sm"
                            {...field}
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Postal code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    className="w-full"
                    disabled={signUpMutation.isPending}
                  >
                    {signUpMutation.isPending ? 'Submitting application...' : 'Submit Application'}
                    <HugeiconsIcon icon={ArrowRight01Icon} />
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link
                      href="/sign-in"
                      className="text-xs font-semibold tracking-widest uppercase text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      Sign In
                    </Link>
                  </p>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
