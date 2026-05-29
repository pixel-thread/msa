'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useAuthStore } from '../stores/auth';
import { Loading } from '@components/loading';
import { ROUTE_ROLE } from '../constants';

type PropsT = {
  children: React.ReactNode;
};

const pageAccessOnlyIfUnAuthenticated: string[] = [
  '/sign-in',
  '/sign-up',
  '/reset-password',
  '/forgot-password',
  '/verify-email',
];

export const Redirect = ({ children }: PropsT) => {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const router = useRouter();
  const pathName = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: isAuthLoading, isSignedIn } = useAuthStore();
  const userRoles = useMemo(() => user?.role || ['MEMBER'], [user]);
  const isAuthenticated = !!user && isSignedIn;

  // Show loader during route changes or delays
  useEffect(() => {
    if (isAuthLoading) return;
    // eslint-disable-next-line
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer); // Cleanup the timer
  }, [isAuthLoading, pathName]);

  // Handle authentication and role-based redirects
  useEffect(() => {
    // Wait until authentication loading is complete to proceed
    if (isAuthLoading) return;

    // Step 1: Identify the current route from the `routeRoles` configuration
    const currentRoute = ROUTE_ROLE.find((route) => {
      if (route.url === pathName) return true; // Direct match for the route
      if (route.url.endsWith('/*')) {
        const basePath = route.url.replace('/*', ''); // Handle wildcard route (e.g., `/dashboard/*`)
        return pathName.startsWith(basePath); // Check if the current path starts with the base path
      }
      return false; // No match found
    });
    // Step 2: Handle authentication-based redirection
    if (currentRoute) {
      // If the route requires authentication and the user is not authenticated
      if (currentRoute.needAuth && !isAuthenticated) {
        // Redirect the user to the signin page and include the current path as a `redirect` query parameter
        router.replace(`/sign-in?redirect=${encodeURIComponent(pathName)}`);
        return; // Exit the logic as redirection is in progress
      }

      // Step 3: Handle role-based access control
      if (isAuthenticated) {
        // Check if the user has at least one of the required roles for the current route
        const hasRequiredRole = currentRoute.role.some((role) =>
          userRoles.some((userRole) => userRole === role),
        );

        // If the user does not have the required role(s)
        if (!hasRequiredRole) {
          // Redirect the user to a fallback page specified in the route's configuration or to the homepage
          router.replace(currentRoute.redirect || '/');
          return; // Exit the logic as redirection is in progress
        }
      }
    }
  }, [pathName, isAuthenticated, userRoles, router, isAuthLoading]);

  // Prevent authenticated users from accessing unauthenticated-only pages
  useEffect(() => {
    if (isAuthLoading || isLoading) return;
    if (isAuthenticated && pageAccessOnlyIfUnAuthenticated.includes(pathName)) {
      router.push(redirectTo || '/');
    }
  }, [isAuthenticated, pathName, redirectTo, router, isAuthLoading, isLoading]);

  // Display preloader if authentication or loading is in progress
  if (isAuthLoading) {
    return <Loading label={'Loading...'} />;
  }

  return <>{children}</>;
};
