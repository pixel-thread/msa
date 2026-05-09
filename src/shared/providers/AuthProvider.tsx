"use client";

import { useEffect } from "react";

import { useAuthStore } from "../stores/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().fetchUser();
  }, []);

  return <>{children}</>;
}

