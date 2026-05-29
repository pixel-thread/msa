'use client';
import { Roboto, Roboto_Mono, JetBrains_Mono } from 'next/font/google';
import { AppProviders } from '@src/shared/providers/AppProviders';
import './globals.css';
import { cn } from '@src/shared/lib/utils';
import { Suspense } from 'react';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
});

const robotoHeading = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-heading',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        'h-full',
        'antialiased',
        roboto.variable,
        robotoHeading.variable,
        robotoMono.variable,
        'font-mono',
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Suspense>
          <AppProviders>{children}</AppProviders>
        </Suspense>
      </body>
    </html>
  );
}
