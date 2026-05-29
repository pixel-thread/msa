'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, user, isLoading } = useAuthStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current && !user && !isLoading) {
      hasFetched.current = true;
      fetchUser();
    }
  }, [user, isLoading, fetchUser]);

  return <>{children}</>;
}
