'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@src/shared/components/ui/button';
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
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@src/features/auth/validators';
import { useForgotPassword } from '@src/features/auth/hooks';

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const forgotPasswordMutation = useForgotPassword();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      await forgotPasswordMutation.mutateAsync(values);
      setIsSuccess(true);
    } catch {}
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-24">
        <Card className="w-full max-w-md border-hairline bg-surface-card">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl font-normal tracking-tight text-ink">
              Check your email
            </CardTitle>
            <CardDescription className="text-body text-base">
              We've sent you a password reset link. Please check your inbox and follow the
              instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-primary hover:text-primary-active"
            >
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-24">
      <Card className="w-full max-w-md border-hairline bg-surface-card">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-normal tracking-tight text-ink">
            Forgot your password?
          </CardTitle>
          <CardDescription className="text-body text-base">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {forgotPasswordMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {forgotPasswordMutation.error?.message || 'Failed to send reset email'}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-body-strong text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email address"
                        className="h-12 border-hairline bg-canvas text-ink placeholder:text-muted-foreground focus-visible:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-11 w-full bg-primary px-5 text-base font-semibold text-on-primary hover:bg-primary-active disabled:bg-primary-disabled"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? 'Sending...' : 'Send reset link'}
              </Button>

              <div className="text-center">
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-primary hover:text-primary-active"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
