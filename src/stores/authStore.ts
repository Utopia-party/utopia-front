import { create } from 'zustand';
import { extendUserSession, getMe, logout as logoutApi } from '../apis/auth';
import type { AuthUser } from '../types/auth';

const SESSION_DURATION_MS = 30 * 60 * 1000; // 30분

const getSessionExpiresAt = (accessTokenExpiresIn?: number | null) => {
  const serverExpiresInMs =
    typeof accessTokenExpiresIn === 'number' && accessTokenExpiresIn > 0
      ? accessTokenExpiresIn * 1000
      : SESSION_DURATION_MS;

  const expiresInMs = Math.min(serverExpiresInMs, SESSION_DURATION_MS);

  return Date.now() + expiresInMs;
};

type AuthState = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  sessionExpiresAt: number | null;

  setUser: (
    user: AuthUser | null,
    accessTokenExpiresIn?: number | null,
  ) => void;
  updateUser: (partialUser: Partial<AuthUser>) => void;
  clearUser: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  withdraw: () => void;
  extendSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  loading: true,
  sessionExpiresAt: null,

  setUser: (user, accessTokenExpiresIn) =>
    set({
      user,
      isLoggedIn: !!user,
      loading: false,
      sessionExpiresAt: user ? getSessionExpiresAt(accessTokenExpiresIn) : null,
    }),

  updateUser: (partialUser) =>
    set((state) => {
      if (!state.user) return state;

      return {
        user: {
          ...state.user,
          ...partialUser,
        },
      };
    }),

  checkAuth: async () => {
    try {
      const res = await getMe();

      if (res.is_logged_in && res.user) {
        set({
          user: res.user,
          isLoggedIn: true,
          loading: false,
          sessionExpiresAt: getSessionExpiresAt(res.access_token_expires_in),
        });
      } else {
        set({
          user: null,
          isLoggedIn: false,
          loading: false,
          sessionExpiresAt: null,
        });
      }
    } catch {
      set({
        user: null,
        isLoggedIn: false,
        loading: false,
        sessionExpiresAt: null,
      });
    }
  },

  logout: async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.error(e);
    }

    set({
      user: null,
      isLoggedIn: false,
      loading: false,
      sessionExpiresAt: null,
    });
  },

  withdraw: () =>
    set({
      user: null,
      isLoggedIn: false,
      loading: false,
      sessionExpiresAt: null,
    }),

  clearUser: () =>
    set({
      user: null,
      isLoggedIn: false,
      loading: false,
      sessionExpiresAt: null,
    }),

  extendSession: async () => {
    try {
      const res = await extendUserSession();

      set({
        sessionExpiresAt: getSessionExpiresAt(res.access_token_expires_in),
      });
    } catch (error) {
      console.error('세션 연장 실패:', error);
      throw error;
    }
  },
}));
