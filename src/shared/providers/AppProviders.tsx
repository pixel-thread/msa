"use client";

import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { Redirect } from "../components/Redirect";
import { Toaster } from "sonner";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <Redirect>{children}</Redirect>
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}