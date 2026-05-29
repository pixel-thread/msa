'use client';

import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { Redirect } from '../components/Redirect';
import { Toaster } from '../components/ui/sonner';
import { TooltipProvider } from '../components/ui/tooltip';
import { ThemeProvider } from './theme-provider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <QueryProvider>
          <AuthProvider>
            <Redirect>{children}</Redirect>
            <Toaster position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
