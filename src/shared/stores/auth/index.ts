"use client";

import type { UserRole as Role } from "@prisma/client";
import { create } from "zustand";

import { ROLE_HIERARCHY } from "@src/shared/constants/roles";
import http from "@src/shared/utils/http";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  mfaEnabled: boolean;
  associationId: string;
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
  signIn: (email: string, password: string) => Promise<{ mfaRequired?: boolean; tempToken?: string }>;
  signUp: (email: string, password: string, name: string, associationId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
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
      const res = await http.get<AuthUser>("/auth/me");

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

  signIn: async (email, password) => {
    set({ isLoading: true });

    try {
      const res = await http.post<{ user: AuthUser; mfaRequired?: boolean; tempToken?: string }>("/auth/sign-in", {
        email,
        password,
      });

      if (!res.success) {
        throw new Error(res.message);
      }

      if (res.data?.mfaRequired) {
        set({ isLoading: false });
        return { mfaRequired: true, tempToken: res.data.tempToken };
      }

      set({
        user: res.data?.user || null,
        isSignedIn: true,
      });

      set({ isLoading: false });
      return {};
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email, password, name, associationId) => {
    set({ isLoading: true });

    try {
      const res = await http.post<{ user: AuthUser }>("/auth/sign-up", {
        email,
        password,
        name,
        associationId,
      });

      if (!res.success) {
        throw new Error(res.message);
      }

      set({
        user: res.data?.user || null,
        isSignedIn: true,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      await http.post("/auth/logout");
    } catch {
    } finally {
      set({
        user: null,
        isSignedIn: false,
      });
    }
  },

  verifyMfa: async (code) => {
    set({ isLoading: true });

    try {
      const res = await http.post<{ user: AuthUser }>("/auth/sign-in/verify", {
        code,
      });

      if (!res.success) {
        throw new Error(res.message);
      }

      set({
        user: res.data?.user || null,
        isSignedIn: true,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
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