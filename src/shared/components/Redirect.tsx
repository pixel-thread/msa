"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "../stores/auth";
import { PUBLIC_ROUTES } from "../constants/routes";

interface RedirectProps {
  children: React.ReactNode;
}

export function Redirect({ children }: RedirectProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isHydrated = useAuthStore((state) => state.isHydrated);

  const isLoading = useAuthStore((state) => state.isLoading);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // wait for zustand hydration
    if (!isHydrated) return;

    // wait for fetchUser()
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) => {
      // exact match for root
      if (route === "/") {
        return pathname === "/";
      }

      // support nested public routes
      return pathname.startsWith(route);
    });

    // not authenticated
    if (!user) {
      // allow public routes
      if (isPublicRoute) return;

      // prevent redirect loop
      if (pathname === "/sign-in") return;

      router.replace("/sign-in");
      return;
    }

    // authenticated user on auth pages
    if (pathname === "/sign-in" || pathname === "/sign-up") {
      router.replace("/");
    }
  }, [isHydrated, isLoading, pathname, router, user]);

  // loading screen
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  // prevent flashing protected pages
  const isPublicRoute = PUBLIC_ROUTES.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(route);
  });

  if (!user && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}

