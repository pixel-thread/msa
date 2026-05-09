"use client";

import { useEffect } from "react";

import { useAuthStore } from "../stores/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, isSignedIn } = useAuthStore();
  useEffect(() => {
    if (!isSignedIn) {
      fetchUser();
    }
  }, [isSignedIn, fetchUser]);

  return <>{children}</>;
}

