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

        return;
      }

      set({
        user: null,
        isLoggedIn: false,
        loading: false,
        sessionExpiresAt: null,
      });
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
      console.log('[session] refresh 요청 시작');

      const refreshRes = await extendUserSession();

      console.log('[session] refresh 응답:', refreshRes);

      /**
       * 중요:
       * refresh API가 200이어도 실제 쿠키/인증이 갱신됐는지는
       * getMe를 다시 호출해봐야 확실합니다.
       */
      const meRes = await getMe();

      console.log('[session] refresh 이후 getMe 확인:', meRes);

      if (!meRes.is_logged_in || !meRes.user) {
        throw new Error('refresh 이후 인증 상태가 유효하지 않습니다.');
      }

      const nextExpiresAt = getSessionExpiresAt(
        refreshRes.access_token_expires_in ?? meRes.access_token_expires_in,
      );

      console.log(
        '[session] 세션 연장 완료:',
        new Date(nextExpiresAt).toLocaleString(),
      );

      set({
        user: meRes.user,
        isLoggedIn: true,
        loading: false,
        sessionExpiresAt: nextExpiresAt,
      });
    } catch (error) {
      console.error('[session] 세션 연장 실패:', error);

      set({
        user: null,
        isLoggedIn: false,
        loading: false,
        sessionExpiresAt: null,
      });

      throw error;
    }
  },
}));
