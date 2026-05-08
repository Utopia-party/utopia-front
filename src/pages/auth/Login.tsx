import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { CaptchaWidget } from '../../components/captcha';
import { useAuthStore } from '../../stores/authStore';
import { login } from '../../apis/auth';
import type { AuthErrorResponse, LoginPayload } from '../../types/auth';
import { FcGoogle } from 'react-icons/fc';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { SiNaver } from 'react-icons/si';
import AppealModal from '../../components/AppealModal';

type LoginForm = LoginPayload & {
  rememberMe: boolean;
};

const EMAIL_DOMAINS = [
  'naver.com',
  'gmail.com',
  'daum.net',
  'kakao.com',
  'nate.com',
  'icloud.com',
  'outlook.com',
];

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBanned = searchParams.get('reason') === 'banned';
  const banType = searchParams.get('ban_type') ?? 'manual';
  const banRefId = searchParams.get('ref_id') ?? undefined;
  const isDuplicateLogin = searchParams.get('reason') === 'duplicate';

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const DEMO_ACCOUNTS = {
    user: {
      email: 'test_user@partyup.kr',
      password: 'test',
    },
    admin: {
      email: 'test_admin@partyup.kr',
      password: 'test',
    },
  } as const;

  const emailValue = form.email.trim();
  const [emailId, emailDomainInput = ''] = emailValue.split('@');

  const shouldShowEmailDomainSuggestions =
    isEmailFocused && emailId.length > 0 && !emailValue.includes('@');

  const shouldShowFilteredEmailDomainSuggestions =
    isEmailFocused &&
    emailId.length > 0 &&
    emailValue.includes('@') &&
    emailDomainInput.length > 0;

  const filteredEmailDomains = EMAIL_DOMAINS.filter((domain) =>
    domain.startsWith(emailDomainInput.toLowerCase()),
  );

  const emailSuggestions = shouldShowEmailDomainSuggestions
    ? EMAIL_DOMAINS.map((domain) => `${emailId}@${domain}`)
    : shouldShowFilteredEmailDomainSuggestions
      ? filteredEmailDomains.map((domain) => `${emailId}@${domain}`)
      : [];

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEmailSuggestionClick = (email: string) => {
    setForm((prev) => ({
      ...prev,
      email,
    }));
    setIsEmailFocused(false);
  };

  const fillDemoAccount = (type: 'user' | 'admin') => {
    const account = DEMO_ACCOUNTS[type];

    setForm((prev) => ({
      ...prev,
      email: account.email,
      password: account.password,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (!captchaToken) {
      alert('캡챠 인증을 완료해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      await login(
        {
          email: form.email.trim(),
          password: form.password,
        },
        captchaToken,
      );

      const { checkAuth } = useAuthStore.getState();
      await checkAuth();

      navigate('/home', { replace: true });
    } catch (error: unknown) {
      const apiError = error as {
        response?: {
          status?: number;
          data?: AuthErrorResponse;
        };
      };

      const status = apiError.response?.status;
      const message =
        apiError.response?.data?.detail ||
        apiError.response?.data?.message ||
        '로그인에 실패했습니다.';

      if (status === 403) {
        const banType =
          message === '이용이 제한된 계정입니다.' ? 'ip_ban' : 'manual';
        navigate(`/login?reason=banned&ban_type=${banType}`, { replace: true });
      } else {
        alert(message);
      }
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

    localStorage.setItem('google_oauth_state', state);

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

    localStorage.setItem('last_google_auth_url', googleAuthUrl);

    window.location.href = googleAuthUrl;
  };

  const loginWithKakao = () => {
    const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY;
    const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI;
    const state = createOAuthState();

    localStorage.setItem('kakao_oauth_state', state);

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

    localStorage.setItem('naver_oauth_state', state);

    const naverAuthUrl =
      `https://nid.naver.com/oauth2.0/authorize` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;

    window.location.href = naverAuthUrl;
  };

  return (
    <div className="mx-auto mt-10 mb-12 max-w-xl rounded-xl border-2 border-gray-200 bg-white p-10 shadow-lg">
      {isDuplicateLogin && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <p className="font-bold">
            중복 로그인이 감지되어 로그아웃 되었습니다.
          </p>
          <p className="mt-1 text-amber-600">
            다른 기기에서 동일한 계정으로 로그인하여 현재 세션이 종료되었습니다.
          </p>
        </div>
      )}
      {isBanned && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-bold">계정이 정지되었습니다.</p>
          <p className="mt-1 text-red-600">
            욕설 등 위반 행위로 인해 자동 로그아웃 처리되었습니다. 문의가
            필요하면 고객센터로 연락해주세요.
          </p>
          <button
            type="button"
            onClick={() => setShowAppealModal(true)}
            className="mt-3 w-full rounded-lg border border-red-300 bg-white py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            이의제기 신청
          </button>
        </div>
      )}

      {showAppealModal && (
        <AppealModal
          banType={banType}
          banRefId={banRefId}
          onClose={() => setShowAppealModal(false)}
        />
      )}

      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-bold text-gray-800">로그인</h1>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fillDemoAccount('user')}
            className="rounded-xl border border-gray-300 bg-gray-50 px-2 py-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            일반 유저 체험 계정 입력
          </button>

          <button
            type="button"
            onClick={() => fillDemoAccount('admin')}
            className="rounded-xl border border-purple-300 bg-purple-50 px-2 py-4 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
          >
            관리자 체험 계정 입력
          </button>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="relative">
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
            onFocus={() => setIsEmailFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsEmailFocused(false), 150);
            }}
            autoComplete="email"
            required
          />

          {emailSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              {emailSuggestions.map((email) => (
                <button
                  key={email}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleEmailSuggestionClick(email)}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  {email}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            비밀번호
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              placeholder="비밀번호 입력"
              className="w-full rounded-lg border border-gray-300 p-3 pr-12 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Link to="/find-id" className="hover:text-blue-600 hover:underline">
            이메일 찾기
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            to="/find-password"
            className="hover:text-blue-600 hover:underline"
          >
            비밀번호 찾기
          </Link>
          <span className="text-gray-300">|</span>
          <Link to="/signup" className="hover:text-blue-600 hover:underline">
            회원가입
          </Link>
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
          disabled={isSubmitting || !captchaToken}
          className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? '로그인 중...' : !captchaToken ? '로그인' : '로그인'}
        </button>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={loginWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 py-3 text-sm font-medium transition hover:bg-gray-50"
          >
            <FcGoogle className="text-lg" />
            <span>구글로 계속하기</span>
          </button>

          <button
            type="button"
            onClick={loginWithKakao}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#FEE500] bg-[#FEE500] py-3 text-sm font-medium text-[#191919] transition hover:bg-[#FADA0A]"
          >
            <RiKakaoTalkFill className="text-lg" />
            <span>카카오로 계속하기</span>
          </button>

          <button
            type="button"
            onClick={loginWithNaver}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#03C75A] bg-[#03C75A] py-3 text-sm font-medium text-white transition hover:bg-[#02b350]"
          >
            <SiNaver className="text-base" />
            <span>네이버로 계속하기</span>
          </button>
        </div>
      </form>
    </div>
  );
}
