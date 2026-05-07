import { createRouteMatcher } from "@clerk/nextjs/server";

import {
  ADMIN_ROUTES,
  API_PUBLIC_ROUTES,
  AUTH_ROUTES,
  PUBLIC_ROUTES,
} from "../constants/routes";

export const isAdminRoute = createRouteMatcher([...ADMIN_ROUTES]);
export const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTES]);
export const isApiPublicRoute = createRouteMatcher([...API_PUBLIC_ROUTES]);
export const isAuthRoute = createRouteMatcher([...AUTH_ROUTES]);
