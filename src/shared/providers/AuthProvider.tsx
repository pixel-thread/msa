"use client";

import { useEffect, useState } from "react";

import { useAuthStore } from "@src/shared/stores/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, setHydrated, isHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHydrated();
  }, [setHydrated]);

  useEffect(() => {
    if (mounted && isHydrated) {
      fetchUser();
    }
  }, [mounted, isHydrated, fetchUser]);

  if (!mounted) {
    return null;
  }

  return children;
}