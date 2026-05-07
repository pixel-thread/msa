"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

import { useAuthStore } from "@store/auth/index";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const store = useAuthStore.getState();
    store.setHydrated();

    if (isLoaded) {
      store.setSignedIn(!!isSignedIn);
      if (isSignedIn && !store.user) {
        store.fetchUser();
      }
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return null;
  }

  return children;
}
