import { ADMIN_ROUTES, API_PUBLIC_ROUTES, AUTH_ROUTES, PUBLIC_ROUTES } from '../constants/routes';

function createMatcher(patterns: readonly string[]) {
  return (pathname: string): boolean => {
    return patterns.some((pattern) => {
      if (pattern.endsWith('(.*)')) {
        const base = pattern.slice(0, -3);
        return pathname.startsWith(base);
      }
      return pathname === pattern || pathname.startsWith(pattern + '/');
    });
  };
}

export const isAdminRoute = createMatcher([...ADMIN_ROUTES]);
export const isPublicRoute = createMatcher([...PUBLIC_ROUTES]);
export const isApiPublicRoute = createMatcher([...API_PUBLIC_ROUTES]);
export const isAuthRoute = createMatcher([...AUTH_ROUTES]);
