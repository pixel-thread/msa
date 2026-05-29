'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ResetPasswordSchema, type ResetPasswordInput } from '@src/features/auth/validators';
import { useResetPassword } from '@src/features/auth/hooks';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isSuccess, setIsSuccess] = useState(false);
  const resetPasswordMutation = useResetPassword();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token: token || '',
      password: '',
    },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    try {
      await resetPasswordMutation.mutateAsync(values);
      setIsSuccess(true);
    } catch {}
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-24">
        <Card className="w-full max-w-md border-hairline bg-surface-card">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl font-normal tracking-tight text-ink">
              Invalid Reset Link
            </CardTitle>
            <CardDescription className="text-body text-base">
              The password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary-active"
            >
              Request new reset link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-24">
        <Card className="w-full max-w-md border-hairline bg-surface-card">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl font-normal tracking-tight text-ink">
              Password Reset Successful
            </CardTitle>
            <CardDescription className="text-body text-base">
              Your password has been reset successfully. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-primary hover:text-primary-active"
            >
              Go to sign in
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
            Reset your password
          </CardTitle>
          <CardDescription className="text-body text-base">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {resetPasswordMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {resetPasswordMutation.error?.message || 'Password reset failed'}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="token"
                render={({ field }) => <input type="hidden" {...field} />}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-body-strong text-sm font-medium">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="New password"
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
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset password'}
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
