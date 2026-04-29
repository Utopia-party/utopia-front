import { create } from 'zustand';
import { extendUserSession, getMe, logout as logoutApi } from '../apis/auth';
import type { AuthUser } from '../types/auth';

// 1️⃣ 상수 선언: 세션 만료 시간을 30분(밀리초)으로 설정합니다.
// 이 파일 안에서 자유롭게 쓸 수 있는 변수입니다.
const SESSION_DURATION_MS = 60 * 60 * 1000;

// 2️⃣ 타입 정의: Zustand 상태 타입에 sessionExpiresAt과 extendSession을 추가합니다.
type AuthState = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  sessionExpiresAt: number | null; // 추가됨

  setUser: (user: AuthUser | null) => void;
  updateUser: (partialUser: Partial<AuthUser>) => void;
  clearUser: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  withdraw: () => void;
  extendSession: () => Promise<void>; // 추가됨
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  loading: true,
  sessionExpiresAt: null, // 3️⃣ 초기 상태값 설정

  setUser: (user) =>
    set({
      user,
      isLoggedIn: !!user,
      loading: false,
      // 유저가 세팅되면 30분 타이머 시작, 없으면 초기화
      sessionExpiresAt: user ? Date.now() + SESSION_DURATION_MS : null,
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
        set((state) => ({
          user: res.user,
          isLoggedIn: true,
          loading: false,
          // 새로고침 시 기존 타이머가 있으면 유지, 없으면 새로 30분 부여
          sessionExpiresAt:
            state.sessionExpiresAt || Date.now() + SESSION_DURATION_MS,
        }));
      } else {
        set({
          user: null,
          isLoggedIn: false,
          loading: false,
          sessionExpiresAt: null, // 로그아웃 상태면 타이머 해제
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
      sessionExpiresAt: null, // 로그아웃 시 타이머 해제
    });
  },

  withdraw: () =>
    set({
      user: null,
      isLoggedIn: false,
      loading: false,
      sessionExpiresAt: null, // 회원탈퇴 시 타이머 해제
    }),

  clearUser: () =>
    set({
      user: null,
      isLoggedIn: false,
      loading: false,
      sessionExpiresAt: null, // 유저 초기화 시 타이머 해제
    }),

  extendSession: async () => {
    try {
      // 1. 백엔드 세션 연장 API 호출 (/refresh)
      await extendUserSession();

      // 2. 성공 시 만료 시간을 현재 시점부터 다시 30분 뒤로 세팅
      set({
        sessionExpiresAt: Date.now() + SESSION_DURATION_MS,
      });
    } catch (error) {
      console.error('세션 연장 실패:', error);
      throw error;
    }
  },
}));
