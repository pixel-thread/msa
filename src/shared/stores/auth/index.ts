"use client";

import { create } from "zustand";
import cookie from "react-cookies";
import http from "@src/shared/utils/http";
import type { UserRole } from "@src/shared/lib/prisma/types";
import { logger } from "@src/shared/logger";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string;
  role: UserRole[];
  mfaEnabled: boolean;
  associationId: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (isLoading: boolean) => void;
  fetchUser: () => Promise<void>;
  isSignedIn: () => boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ mfaRequired?: boolean; tempToken?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    associationId?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  resendMfaCode: () => Promise<void>;
  setupMfa: (password: string) => Promise<void>;
  enableMfa: (code: string) => Promise<void>;
  disableMfa: (password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isSignedIn: () => false,

  setUser: (user: AuthUser | null) => set({ user }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  fetchUser: async () => {
    set({ isLoading: true });

    try {
      const res = await http.get<AuthUser>("/auth/me");

      if (!res.success || !res.data) {
        set({ user: null });
        return;
      }

      set({ user: res.data });
    } catch {
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });

    try {
      const res = await http.post<{
        user: AuthUser;
        mfaRequired?: boolean;
        tempToken?: string;
      }>("/auth/sign-in", {
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

      set({ user: res.data?.user || null });
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

      set({ user: res.data?.user || null });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      await http.post("/auth/logout", {});
    } catch (error) {
      logger.debug("Failed to sign out", { error });
    } finally {
      set({ user: null });
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

      set({ user: res.data?.user || null });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resendMfaCode: async () => {
    try {
      const res = await http.post<{ codeSent: boolean }>(
        "/auth/mfa/resend-login",
      );
      if (!res.success) {
        throw new Error(res.message);
      }
    } catch (error) {
      throw error;
    }
  },

  setupMfa: async (password: string) => {
    set({ isLoading: true });
    try {
      const res = await http.post<{ pending: boolean; codeSent: boolean }>(
        "/auth/mfa/setup",
        { password },
      );
      if (!res.success) {
        throw new Error(res.message);
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
    set({ isLoading: false });
  },

  enableMfa: async (code: string) => {
    set({ isLoading: true });
    try {
      const res = await http.post<{ user: AuthUser }>("/auth/mfa/verify", {
        code,
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      set({ user: res.data?.user || null });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  disableMfa: async (password: string) => {
    set({ isLoading: true });
    try {
      const res = await http.post<{ user: AuthUser }>("/auth/mfa/disable", {
        password,
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      set({ user: res.data?.user || null });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
