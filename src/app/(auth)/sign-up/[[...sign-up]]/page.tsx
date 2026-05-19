"use client";

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
import { SignUpSchema, type SignUpInput } from "@src/features/auth/validators";
import { useSignUp } from "@src/features/auth/hooks";

export default function SignUpPage() {
  const router = useRouter();
  const signUpMutation = useSignUp();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: SignUpInput) => {
    try {
      await signUpMutation.mutateAsync(values);
      router.push("/sign-in");
    } catch {}
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-24">
      <Card className="w-full max-w-md rounded-xl border-hairline bg-surface-card">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-normal tracking-tight text-ink">
            Create your account
          </CardTitle>
          <CardDescription className="text-body text-base">
            Fill in your details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {signUpMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {signUpMutation.error?.message || "Sign up failed"}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-body-strong text-sm font-medium">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Full name"
                        className="h-12 rounded-md border-hairline bg-canvas text-ink placeholder:text-muted focus-visible:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        className="h-12 rounded-md border-hairline bg-canvas text-ink placeholder:text-muted focus-visible:border-primary"
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
                        className="h-12 rounded-md border-hairline bg-canvas text-ink placeholder:text-muted focus-visible:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-body-strong text-sm font-medium">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm password"
                        className="h-12 rounded-md border-hairline bg-canvas text-ink placeholder:text-muted focus-visible:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-11 w-full rounded-full bg-primary px-5 text-base font-semibold text-on-primary hover:bg-primary-active disabled:bg-primary-disabled"
                disabled={signUpMutation.isPending}
              >
                {signUpMutation.isPending ? "Creating account..." : "Sign up"}
              </Button>

              <p className="text-center text-sm text-body">
                Already have an account?{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-primary hover:text-primary-active"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
