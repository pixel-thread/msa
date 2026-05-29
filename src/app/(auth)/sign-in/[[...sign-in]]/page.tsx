'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Shield01Icon,
  BankIcon,
  UserGroupIcon,
  CheckmarkBadge01Icon,
  ArrowRight01Icon,
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
import {
  SignInSchema,
  type SignInInput,
  VerifySignInSchema,
  type VerifySignInInput,
} from '@src/features/auth/validators';
import { useSignIn, useVerifyMfa } from '@src/features/auth/hooks';
import { logger } from '@src/shared/logger';
import { PublicFooter } from '@src/shared/components/public-footer';
import { toast } from 'sonner';

const BENEFITS = [
  {
    icon: Shield01Icon,
    title: 'DPDP Compliant',
    description:
      "Your data is protected under India's Data Protection Act with AES-256 encryption.",
  },
  {
    icon: BankIcon,
    title: 'Financial Ledger',
    description: 'Full double-entry accounting with automated reports and audit trails.',
  },
  {
    icon: UserGroupIcon,
    title: 'Meeting Governance',
    description: 'Schedule, manage agendas, record minutes, and track attendance seamlessly.',
  },
  {
    icon: CheckmarkBadge01Icon,
    title: 'Role-Based Access',
    description: 'Granular permissions across six roles with complete audit logging.',
  },
];

export default function SignInPage() {
  const signInMutation = useSignIn();
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null);

  const form = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: SignInInput) => {
    try {
      const result = await signInMutation.mutateAsync(values);

      if (result.data?.mfaRequired) {
        setMfaTempToken(result.data.tempToken || null);
      }
    } catch (e) {
      logger.error('Sign in failed', { error: e });
    }
  };

  if (mfaTempToken) {
    return <MfaVerify onBack={() => setMfaTempToken(null)} tempToken={mfaTempToken} />;
  }

  return (
    <AuthLayout>
      <div className="hidden md:flex md:w-1/2 flex-col justify-center px-12 lg:px-16">
        <div className="mx-auto max-w-md">
          <Badge variant="default" className="mb-6">
            Welcome Back
          </Badge>
          <Text variant="display-md" asChild>
            <h1 className="mb-6">Sign In to MFSA Connect</h1>
          </Text>
          <Text variant="body-md" color="muted" asChild>
            <p className="mb-10 leading-relaxed">
              Access your association dashboard, manage subscriptions, view financial records, and
              participate in governance — all from one secure platform.
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
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 md:w-1/2">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <CardTitle className="font-heading text-2xl font-bold tracking-wider uppercase">
              Sign In
            </CardTitle>
            <CardDescription>Enter your email and password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {signInMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {signInMutation.error?.message || 'Sign in failed'}
                    </AlertDescription>
                  </Alert>
                )}

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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold tracking-widest uppercase text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  className="w-full"
                  disabled={signInMutation.isPending}
                >
                  {signInMutation.isPending ? 'Signing in...' : 'Sign In'}
                  <HugeiconsIcon icon={ArrowRight01Icon} />
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/sign-up"
                    className="text-xs font-semibold tracking-widest uppercase text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Sign Up
                  </Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

function MfaVerify({ onBack, tempToken }: { onBack: () => void; tempToken: string }) {
  const router = useRouter();
  const verifyMfaMutation = useVerifyMfa();

  const form = useForm<VerifySignInInput>({
    resolver: zodResolver(VerifySignInSchema),
    defaultValues: {
      code: '',
      mfa_temp_token: tempToken,
    },
  });

  const onSubmit = async (values: VerifySignInInput) => {
    try {
      await verifyMfaMutation.mutateAsync(values, {
        onSuccess: (data) => {
          if (data.success) {
            toast.success(data.message);
            return;
          }
          toast.error(data.message);
        },
      });
      router.push('/dashboard');
    } catch {}
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-24 pt-28">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <CardTitle className="font-heading text-2xl font-bold tracking-wider uppercase">
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>Enter the 6-digit code sent to your email</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {verifyMfaMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {verifyMfaMutation.error?.message || 'Verification failed'}
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          maxLength={6}
                          className="text-center text-2xl tracking-widest"
                          placeholder="000000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="default"
                  className="w-full"
                  disabled={verifyMfaMutation.isPending || form.getValues('code').length !== 6}
                >
                  {verifyMfaMutation.isPending ? 'Verifying...' : 'Verify'}
                </Button>

                <div className="flex flex-col gap-2 text-center">
                  <Button type="button" variant="link" onClick={onBack}>
                    Back to sign in
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <div className="flex flex-1 h-full flex-col md:flex-row pt-16">{children}</div>
      <PublicFooter />
    </div>
  );
}
