import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../libs/api';
import { CaptchaWidget } from '../components/captcha';
import { useAuthStore } from '../stores/authStore';

type LoginForm = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type ApiError = {
  response?: {
    data?: {
      detail?: string;
      message?: string;
    };
  };
};

export default function Login() {
  const navigate = useNavigate();

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    //--------도상원-------
    if (!captchaToken) {
      alert('캡챠 인증을 완료해주세요.');
      return;
    }
    //--------도상원-------

    try {
      setIsSubmitting(true);

      const response = await api.post(
        '/login',
        {
          email: form.email.trim(),
          password: form.password,
        },
        {
          headers: captchaToken ? { 'X-Captcha-Token': captchaToken } : {},
        },
      );

      const { checkAuth } = useAuthStore.getState();
      await checkAuth();

      alert(response.data?.message || '로그인에 성공했습니다.');
      navigate('/home', { replace: true });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const message =
        apiError?.response?.data?.detail ||
        apiError?.response?.data?.message ||
        '로그인에 실패했습니다.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const createOAuthState = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const loginWithGoogle = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
    const state = createOAuthState();

    sessionStorage.setItem('google_oauth_state', state);

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=${encodeURIComponent(state)}` +
      `&access_type=online` +
      `&include_granted_scopes=true` +
      `&prompt=select_account`;

    window.location.href = googleAuthUrl;
  };

  const loginWithKakao = () => {
    const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY;
    const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI;
    const state = createOAuthState();

    sessionStorage.setItem('kakao_oauth_state', state);

    const kakaoAuthUrl =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(state)}`;

    window.location.href = kakaoAuthUrl;
  };

  const loginWithNaver = () => {
    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_NAVER_REDIRECT_URI;
    const state = createOAuthState();

    sessionStorage.setItem('naver_oauth_state', state);

    const naverAuthUrl =
      `https://nid.naver.com/oauth2.0/authorize` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;

    window.location.href = naverAuthUrl;
  };

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border-2 border-gray-200 bg-white p-10 shadow-lg">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">로그인</h1>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이메일
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            placeholder="example@email.com"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            비밀번호
          </label>
          <input
            name="password"
            type="password"
            value={form.password}
            placeholder="비밀번호 입력"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="rememberMe"
              checked={form.rememberMe}
              className="h-4 w-4 rounded border-gray-300"
              onChange={handleChange}
            />
            <span>자동 로그인</span>
          </label>

          <div className="flex gap-2">
            <Link to="/find-id" className="hover:underline">
              아이디 찾기
            </Link>
            <span>|</span>
            <Link to="/find-password" className="hover:underline">
              비밀번호 찾기
            </Link>
            <span>|</span>
            <Link to="/signup" className="hover:underline">
              회원가입
            </Link>
          </div>
        </div>

        <div className="flex justify-center py-1">
          <CaptchaWidget
            onSuccess={(token) => setCaptchaToken(token)}
            onError={() => setCaptchaToken(null)}
            triggerType="new_ip_login"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? '로그인 중...' : '로그인'}
        </button>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={loginWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 py-3 text-sm font-medium transition hover:bg-gray-50"
          >
            구글 로그인
          </button>

          <button
            type="button"
            onClick={loginWithKakao}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#FEE500] bg-[#FEE500] py-3 text-sm font-medium text-[#191919] transition hover:bg-[#FADA0A]"
          >
            카카오로 계속하기
          </button>

          <button
            type="button"
            onClick={loginWithNaver}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#03C75A] bg-[#03C75A] py-3 text-sm font-medium text-white transition hover:bg-[#02b350]"
          >
            네이버로 계속하기
          </button>
        </div>
      </form>
    </div>
  );
}
