import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";

import { cn } from "@lib/utils";

export const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif",
});

export const robotoSans = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

const siteUrl = "http://localhost:3000";

export const siteConfig = {
  name: "D' Bakery & Eatery",
  description:
    "Artisan bakery serving fresh breads, pastries, and cakes. Order online for pickup or delivery.",
  url: siteUrl,
  keywords: [
    "bakery",
    "artisan",
    "bread",
    "pastry",
    "cakes",
    "coffee",
    "breakfast",
  ],
};

export const appMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const appViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#371f17" },
  ],
  width: "device-width",
  height: "device-height",
  initialScale: 1,
  maximumScale: 1,
};

export const fontVariables = cn(
  roboto.variable,
  robotoSans.variable,
  robotoMono.variable,
);
