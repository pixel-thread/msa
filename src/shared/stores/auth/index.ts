"use client";

import type { UserRole as Role } from "@prisma/client";
import { create } from "zustand";

import { ROLE_HIERARCHY } from "@src/shared/constants/roles";
import http from "@src/shared/utils/http";

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: Role;
  phone: string | null;
}

export interface AuthState {
  isHydrated: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  isLoading: boolean;

  setHydrated: () => void;
  setSignedIn: (isSignedIn: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearUser: () => void;
  fetchUser: () => Promise<void>;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  hasRole: (role: Role) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  isSignedIn: false,
  user: null,
  isLoading: false,

  setHydrated: () => set({ isHydrated: true }),

  setSignedIn: (isSignedIn: boolean) => set({ isSignedIn }),

  setUser: (user: AuthUser | null) => set({ user }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  clearUser: () =>
    set({
      user: null,
      isSignedIn: false,
    }),

  fetchUser: async () => {
    set({ isLoading: true });

    try {
      const res = await http.get<AuthUser>("/me");

      if (!res.success || !res.data) {
        set({ user: null, isSignedIn: false });
        return;
      }

      set({
        user: res.data,
        isSignedIn: true,
      });
    } catch {
      set({ user: null, isSignedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },

  isAdmin: () => {
    const { user } = get();
    return user?.role === "SUPER_ADMIN";
  },

  isSuperAdmin: () => {
    const { user } = get();
    return user?.role === "SUPER_ADMIN";
  },

  hasRole: (role: Role) => {
    const { user } = get();
    if (!user) return false;

    return ROLE_HIERARCHY[user.role] <= ROLE_HIERARCHY[role];
  },
}));
