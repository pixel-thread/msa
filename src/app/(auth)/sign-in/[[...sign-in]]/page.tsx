"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@src/shared/components/ui/card";
import { Alert, AlertDescription } from "@src/shared/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@src/shared/components/ui/form";
import {
  SignInSchema,
  type SignInInput,
  VerifySignInSchema,
  type VerifySignInInput,
} from "@src/features/auth/validators";
import { useSignIn, useVerifyMfa } from "@src/features/auth/hooks";
import { logger } from "@src/shared/logger";

export default function SignInPage() {
  const router = useRouter();
  const signInMutation = useSignIn();
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null);

  const form = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInInput) => {
    try {
      const result = await signInMutation.mutateAsync(values);

      if (result.data?.mfaRequired) {
        setMfaTempToken(result.data.tempToken || null);
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      logger.error("Sign in failed", { error: e });
    }
  };

  if (mfaTempToken) {
    return (
      <MfaVerify
        onBack={() => setMfaTempToken(null)}
        tempToken={mfaTempToken}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-24">
      <Card className="w-full max-w-md rounded-xl border-hairline bg-surface-card">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-normal tracking-tight text-ink">
            Sign in to your account
          </CardTitle>
          <CardDescription className="text-body text-base">
            Enter your email and password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {signInMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {signInMutation.error?.message || "Sign in failed"}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-body-strong text-sm font-medium">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email address"
                        className="h-12 rounded-md border-hairline bg-canvas text-ink placeholder:text-muted-foreground focus-visible:border-primary"
                        {...field}
                      />
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
                    <FormLabel className="text-body-strong text-sm font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        className="h-12 rounded-md border-hairline bg-canvas text-ink placeholder:text-muted-foreground focus-visible:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-active"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-full bg-primary px-5 text-base font-semibold text-on-primary hover:bg-primary-active disabled:bg-primary-disabled"
                disabled={signInMutation.isPending}
              >
                {signInMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>

              <p className="text-center text-sm text-body">
                Don&#39;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="font-medium text-primary hover:text-primary-active"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function MfaVerify({
  onBack,
  tempToken,
}: {
  onBack: () => void;
  tempToken: string;
}) {
  const router = useRouter();
  const verifyMfaMutation = useVerifyMfa();

  const form = useForm<VerifySignInInput>({
    resolver: zodResolver(VerifySignInSchema),
    defaultValues: {
      code: "",
      mfa_temp_token: tempToken,
    },
  });

  const onSubmit = async (values: VerifySignInInput) => {
    try {
      await verifyMfaMutation.mutateAsync(values);
      router.push("/dashboard");
    } catch {}
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-24">
      <Card className="w-full max-w-md rounded-xl border-hairline bg-surface-card">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-normal tracking-tight text-ink">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-body text-base">
            Enter the 6-digit code sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {verifyMfaMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {verifyMfaMutation.error?.message || "Verification failed"}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-body-strong text-sm font-medium">
                      Verification Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        maxLength={6}
                        className="h-12 rounded-md border-hairline bg-canvas text-center text-2xl tracking-widest text-ink placeholder:text-muted-foreground focus-visible:border-primary"
                        placeholder="000000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-11 w-full rounded-full bg-primary px-5 text-base font-semibold text-on-primary hover:bg-primary-active disabled:bg-primary-disabled"
                disabled={
                  verifyMfaMutation.isPending ||
                  form.getValues("code").length !== 6
                }
              >
                {verifyMfaMutation.isPending ? "Verifying..." : "Verify"}
              </Button>

              <div className="flex flex-col gap-2 text-center">
                <button
                  type="button"
                  onClick={onBack}
                  className="text-sm text-body hover:text-body-strong"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
