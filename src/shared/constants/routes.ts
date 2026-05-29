import { UserRole } from '@prisma/client';

/**
 * Admin-only routes that require the 'admin' role.
 */
export const ADMIN_ROUTES = ['/api/admin(.*)', '/admin(.*)'] as const;

/**
 * Publicly accessible web pages that do not require authentication.
 */
export const PUBLIC_ROUTES = [
  '/',
  '/docs',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/forbidden',
  '/membership-applications',
  '/*',
] as const;

/**
 * Publicly accessible API endpoints that do not require authentication.
 */
export const API_PUBLIC_ROUTES = [
  '/api/health',
  '/api/docs',
  '/api/auth/refresh',
  '/api/auth/sign-up',
  '/api/auth/sign-in',
  '/api/auth/sign-in/verify',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/payments/webhook',
  '/api/logs',
] as const;

/**
 * Private routes that require an authenticated user.
 */
export const AUTH_ROUTES = ['/dashboard(.*)', '/settings(.*)', '/profile(.*)'] as const;

type RouteRole = {
  url: string;
  role: UserRole[];
  redirect: string;
  needAuth: boolean;
};

const nonMemberRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.PRESIDENT,
  UserRole.SECRETARY,
  UserRole.FINANCE,
  UserRole.DPO,
];

const allRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.PRESIDENT,
  UserRole.SECRETARY,
  UserRole.FINANCE,
  UserRole.DPO,
];
const onlySuperAdmin = [UserRole.SUPER_ADMIN];

export const ROUTE_ROLE: RouteRole[] = [
  {
    url: '/',
    role: allRoles,
    redirect: '/',
    needAuth: false,
  },
  {
    url: '/dashboard/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/announcement/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/associations/current/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/associations/*',
    role: onlySuperAdmin,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/audit-logs/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/compliance/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/consent/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/dsar/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/ledger/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/meetings/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/member-types/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/members/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/payments/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/subscriptions/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
  {
    url: '/training/*',
    role: nonMemberRoles,
    redirect: '/forbidden',
    needAuth: true,
  },
];
