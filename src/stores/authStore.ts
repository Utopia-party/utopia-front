import { create } from 'zustand';
import { getMe, logout as logoutApi } from '../apis/auth';
import type { AuthUser } from '../types/auth';

type AuthState = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;

  setUser: (user: AuthUser | null) => void;
  updateUser: (partialUser: Partial<AuthUser>) => void;
  clearUser: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  loading: true,

  setUser: (user) =>
    set({
      user,
      isLoggedIn: !!user,
      loading: false,
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
        });
      } else {
        set({
          user: null,
          isLoggedIn: false,
          loading: false,
        });
      }
    } catch {
      set({
        user: null,
        isLoggedIn: false,
        loading: false,
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
    });
  },

  clearUser: () =>
    set({
      user: null,
      isLoggedIn: false,
      loading: false,
    }),
}));
