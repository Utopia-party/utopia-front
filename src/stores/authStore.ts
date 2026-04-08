import { create } from 'zustand';
import { getMe, logout as logoutApi } from '../apis/auth';
import type { AuthUser } from '../types/auth';

/* 로그인 상태 전역 관리 */

type AuthState = {
  user: AuthUser | null;
  isLoggedIn: boolean; // 로그인 여부 : true -> 로그인성공 , false -> 로그인 실패
  loading: boolean; // 로그인 상태 확인중 : true -> 아직 확인중 , false -> 확인완료

  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  loading: true,

  // 앱 시작시 실행
  setUser: (user) =>
    set({
      user,
      isLoggedIn: true,
      loading: false,
    }),

  // 현재 로그인(/me) 상태 판단
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

  // 사용자 로그아웃 시 로그인 상태 초기화
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

  // 강제 로그아웃 및 인증 실패 시 로그인 상태 초기화
  clearUser: () =>
    set({
      user: null,
      isLoggedIn: false,
      loading: false,
    }),
}));
