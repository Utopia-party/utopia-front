import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../libs/api';
import { CaptchaWidget } from '../components/captcha';

export default function Login() {
  const navigate = useNavigate();

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // 로그인 입력 폼
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // 로그인 폼 입력 핸들러
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // 일반 로그인 서버 요청
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await api.post(
        '/login',
        {
          email: form.email,
          password: form.password,
        },
        {
          headers: captchaToken ? { 'X-Captcha-Token': captchaToken } : {},
        },
      );

      window.dispatchEvent(new Event('auth-changed'));
      alert('로그인에 성공했습니다!');
      navigate('/', { replace: true });
    } catch (error: any) {
      alert(error.response?.data?.detail || '로그인에 실패했습니다.');
    }
  };

  // OAuth state 생성
  const createOAuthState = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  // 구글 로그인 실행
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

  // 카카오 로그인 실행
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

  // 네이버 로그인 실행
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
            아이디(이메일)
          </label>
          <input
            name="email"
            type="email"
            placeholder="example@email.com"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
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
            placeholder="비밀번호 입력"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="rememberMe"
              className="h-4 w-4 rounded border-gray-300"
              onChange={handleChange}
            />
            <span>자동 로그인</span>
          </label>
          <div className="flex gap-2">
            <button type="button" className="hover:underline">
              아이디 찾기
            </button>
            <span>|</span>
            <button type="button" className="hover:underline">
              비밀번호 찾기
            </button>
            <span>|</span>
            <Link to="/signup" className="hover:underline">
              계정이 없나요? 회원가입
            </Link>
          </div>
        </div>

        {/* 캡챠 인증 */}
        <div className="flex justify-center py-1">
          <CaptchaWidget
            onSuccess={(token) => setCaptchaToken(token)}
            triggerType="new_ip_login"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700"
        >
          로그인
        </button>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={loginWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 py-3 text-sm font-medium transition hover:bg-gray-50"
          >
            <img
              src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
              alt="Google"
              className="h-5 w-5"
            />
            구글 로그인
          </button>

          <button
            type="button"
            onClick={loginWithKakao}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#FEE500] bg-[#FEE500] py-3 text-sm font-medium text-[#191919] transition hover:bg-[#FADA0A]"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg"
              alt="Kakao"
              className="h-5 w-5"
            />
            카카오로 계속하기
          </button>

          <button
            type="button"
            onClick={loginWithNaver}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#03C75A] bg-[#03C75A] py-3 text-sm font-medium text-white transition hover:bg-[#02b350]"
          >
            <span className="text-lg font-bold">N</span>
            네이버로 계속하기
          </button>
        </div>
      </form>
    </div>
  );
}
