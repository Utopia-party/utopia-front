import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import axios from 'axios';
import { api } from '../libs/api';
import { useAuthStore } from '../stores/authStore';

type SocialLoginNeedNicknameResponse = {
  status: 'NEED_NICKNAME';
  oauth: string;
  oauth_id: string;
  email: string | null;
  name: string | null;
};

type SocialLoginSuccessResponse = {
  status?: 'LOGIN_SUCCESS' | 'SIGNUP_SUCCESS';
  message?: string;
  user?: {
    email: string;
    nickname: string;
    name: string;
  };
};

type SocialLoginResponse =
  | SocialLoginNeedNicknameResponse
  | SocialLoginSuccessResponse;

const supportedProviders = ['google', 'kakao', 'naver'] as const;

export default function SocialCallback() {
  const navigate = useNavigate();
  const { provider } = useParams();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const handleSocialCallback = async () => {
      const oauth = (provider || '').toLowerCase();

      if (
        !supportedProviders.includes(
          oauth as (typeof supportedProviders)[number],
        )
      ) {
        navigate('/login', {
          replace: true,
          state: { errorMessage: '지원하지 않는 소셜 로그인 경로입니다.' },
        });
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      const errorDescription =
        params.get('error_description') || params.get('error_message');

      if (error) {
        navigate('/login', {
          replace: true,
          state: {
            errorMessage: errorDescription || `${oauth} 로그인에 실패했습니다.`,
          },
        });
        return;
      }

      if (!code) {
        navigate('/login', {
          replace: true,
          state: { errorMessage: '인가코드를 찾을 수 없습니다.' },
        });
        return;
      }

      const storageKey = `${oauth}_oauth_state`;
      const savedState = sessionStorage.getItem(storageKey);

      if (!state) {
        navigate('/login', {
          replace: true,
          state: { errorMessage: '잘못된 요청입니다. 다시 시도해주세요.' },
        });
        return;
      }

      if (!savedState || state !== savedState) {
        sessionStorage.removeItem(storageKey);
        navigate('/login', {
          replace: true,
          state: {
            errorMessage: '로그인 검증에 실패했습니다. 다시 시도해주세요.',
          },
        });
        return;
      }

      try {
        const payload: { oauth: string; code: string; state?: string } = {
          oauth,
          code,
          state,
        };

        const response = await api.post<SocialLoginResponse>(
          '/api/auth/login',
          payload,
        );

        const data = response.data;

        if (data.status === 'NEED_NICKNAME') {
          sessionStorage.removeItem(storageKey);

          navigate('/social-signup', {
            replace: true,
            state: {
              oauth: data.oauth,
              oauth_id: data.oauth_id,
              email: data.email,
              name: data.name,
            },
          });
          return;
        }

        sessionStorage.removeItem(storageKey);

        const { checkAuth } = useAuthStore.getState();
        await checkAuth();

        window.history.replaceState({}, document.title, '/home');
        navigate('/home', { replace: true });
      } catch (error: unknown) {
        sessionStorage.removeItem(storageKey);

        let errorMessage = `${oauth} 로그인에 실패했습니다.`;

        if (axios.isAxiosError(error)) {
          errorMessage =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            errorMessage;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        navigate('/login', {
          replace: true,
          state: { errorMessage },
        });
      }
    };

    handleSocialCallback();
  }, [navigate, provider]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 text-4xl">⏳</div>
        <p className="text-sm text-muted-foreground">
          소셜 로그인 처리 중입니다...
        </p>
      </div>
    </div>
  );
}
