"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "./QueryProvider";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ClerkProvider>
      <QueryProvider>{children}</QueryProvider>
    </ClerkProvider>
  );
}