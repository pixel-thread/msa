'use client';

import { create } from 'zustand';
import http from '@src/shared/utils/http';
import type { UserRole } from '@src/shared/types';
import { sharedEndpoints } from '@src/shared/constants';

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
  isSignedIn: boolean;
  verifyMfa: (code: string) => Promise<void>;
  resendMfaCode: () => Promise<void>;
  setupMfa: (password: string) => Promise<void>;
  enableMfa: (code: string) => Promise<void>;
  disableMfa: (password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isSignedIn: false,

  setUser: (user: AuthUser | null) => set({ user }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  fetchUser: async () => {
    set({ isLoading: true });

    try {
      const res = await http.get<AuthUser>(sharedEndpoints.auth.me);

      if (!res.success || !res.data) {
        set({ user: null, isSignedIn: false, isLoading: false });
        return;
      }

      set({ user: res.data, isSignedIn: true, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  verifyMfa: async (code) => {
    set({ isLoading: true });

    try {
      const res = await http.post<{ user: AuthUser }>(sharedEndpoints.auth.mfaVerify, { code });

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
      const res = await http.post<{ codeSent: boolean }>(sharedEndpoints.auth.mfaResend);
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
        sharedEndpoints.auth.mfaSetup,
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
      const res = await http.post<{ user: AuthUser }>(sharedEndpoints.auth.mfaVerify, { code });
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
      const res = await http.post<{ user: AuthUser }>(sharedEndpoints.auth.mfaDisable, {
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
