import { create } from 'zustand';
import { api } from '../libs/api';

/* 전역상태관리파일 */

type User = {
  user_id: string;
  email: string;
  nickname: string;
  provider: string;
};

type AuthState = {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;

  setUser: (user: User) => void;
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
      isLoggedIn: true,
      loading: false,
    }),

  clearUser: () =>
    set({
      user: null,
      isLoggedIn: false,
      loading: false,
    }),

  checkAuth: async () => {
    try {
      const res = await api.get('/me');

      if (res.data?.is_logged_in && res.data.user) {
        set({
          user: res.data.user,
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
      await api.post('/logout');
    } catch (e) {
      console.error(e);
    }

    set({
      user: null,
      isLoggedIn: false,
      loading: false,
    });
  },
}));
