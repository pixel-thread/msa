"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/docs"];

export function Redirect({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (PUBLIC_PATHS.includes(pathname)) return;
    
    if (!isSignedIn && !redirectRef.current) {
      redirectRef.current = true;
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router, pathname]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isSignedIn && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return <>{children}</>;
}