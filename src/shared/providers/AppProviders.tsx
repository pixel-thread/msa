"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { Redirect } from "../components/Redirect";
import { env } from "@src/env";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <QueryProvider>
        <AuthProvider>
          <Redirect>{children}</Redirect>
        </AuthProvider>
      </QueryProvider>
    </ClerkProvider>
  );
}

