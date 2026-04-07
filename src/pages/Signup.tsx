import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../libs/api';
import { useNavigate } from 'react-router';
import { CaptchaWidget } from '../components/captcha';
import { useAuthStore } from '../stores/authStore'; // 상원

export default function Signup() {
  const navigate = useNavigate();
  // 상원: 회원가입 직후 로그인 상태를 다시 읽어 관심사 저장 페이지가 회원 API를 바로 쓰게 합니다.
  const { checkAuth } = useAuthStore(); // 상원

  const [form, setForm] = useState({
    email: '',
    email_code: '',
    password: '',
    confirm_password: '',
    name: '',
    nickname: '',
    birth_date: '',
    phone: '',
  });

  const [isEmailChecked, setisEmailChecked] = useState(false);
  const [isNicknameChecked, setisNicknameChecked] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'email') {
      setisEmailChecked(false);
      setIsEmailVerified(false);
    }
    if (name === 'nickname') setisNicknameChecked(false);
  };

  const handleCheckEmail = async () => {
    if (!form.email) return alert('이메일을 입력해주세요.');
    try {
      // 상원: 입력한 이메일이 이미 가입된 계정인지 서버에 확인합니다.
      const response = await api.get('/api/users/check-email', {
        params: { email: form.email },
      });
      if (response.data.exists) {
        alert('이미 사용 중인 이메일입니다.');
        setisEmailChecked(false);
      } else {
        alert('사용 가능한 이메일입니다. 이제 인증번호를 요청하세요.');
        setisEmailChecked(true);
      }
    } catch {
      // 상원: 회원가입 전 이메일 중복 확인 실패는 여기서 한 번에 처리합니다.
      alert('중복 확인 중 오류가 발생했습니다.');
    }
  };

  // 이메일 인증 요청
  const handleEmailRequest = async () => {
    if (!isEmailChecked) return alert('먼저 이메일 중복 확인을 해주세요.');
    try {
      // 상원: 중복 확인을 통과한 이메일에 인증 메일 발송을 요청합니다.
      await api.post('/api/email-request', null, {
        params: { email: form.email },
      });
      alert('인증 메일이 발송되었습니다. 메일함을 확인해주세요!');
    } catch {
      // 상원: 이메일 인증 요청 실패는 회원가입 흐름을 멈추고 재시도를 유도합니다.
      alert('인증 메일 발송에 실패했습니다.');
    }
  };

  // 이메일 인증 확인
  const handleEmailVerify = async () => {
    if (!form.email_code) return alert('인증번호를 입력해주세요.');
    try {
      // 상원: 사용자가 입력한 인증번호가 맞는지 서버에서 검증합니다.
      const response = await api.post('/api/email-verify', null, {
        params: { email: form.email, code: form.email_code },
      });
      if (response.data.success) {
        alert('이메일 인증에 성공했습니다!');
        setIsEmailVerified(true);
      }
    } catch {
      // 상원: 이메일 인증번호 검증 실패는 인증 상태를 열지 않고 그대로 유지합니다.
      alert('인증번호가 틀렸거나 만료되었습니다.');
    }
  };

  // 닉네임 중복검사
  const handleCheckNickname = async () => {
    if (!form.nickname) return alert('닉네임을 입력해주세요.');
    try {
      // 상원: 닉네임 중복 여부도 회원가입 제출 전에 서버에서 확인합니다.
      const response = await api.get('/api/users/check-nickname', {
        params: { nickname: form.nickname },
      });
      if (response.data.exists) {
        alert('이미 사용 중인 닉네임입니다.');
        setisNicknameChecked(false);
      } else {
        alert('사용 가능한 닉네임입니다.');
        setisNicknameChecked(true);
      }
    } catch {
      // 상원: 닉네임 중복 확인 실패도 회원가입 제출 전에 명확히 막습니다.
      alert('중복 확인 중 오류가 발생했습니다.');
    }
  };

  // 상원: 회원가입 제출은 이메일 인증, 닉네임 확인, 캡챠 통과가 모두 끝난 뒤에만 진행됩니다.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // 상원: 브라우저 기본 제출을 막고 API 기반 회원가입 흐름으로 처리합니다.
    e.preventDefault();

    if (!isEmailVerified || !isNicknameChecked) {
      alert('이메일 인증과 닉네임 중복 확인을 완료해주세요.');
      return;
    }
    if (!captchaToken) {
      alert('캡챠 인증을 완료해주세요.');
      return;
    }

    try {
      // 상원: 회원가입 정보와 1차 캡챠 통과 토큰을 함께 서버로 전송합니다.
      const response = await api.post(
        '/api/users',
        {
          // 상원: 사용자가 입력한 이메일을 회원가입 요청 바디에 넣습니다.
          email: form.email,
          // 상원: 사용자가 사용할 닉네임을 회원가입 요청 바디에 넣습니다.
          nickname: form.nickname,
          // 상원: 비밀번호는 서버에서 해시 저장하도록 평문으로 전달됩니다.
          password: form.password,
          // 상원: 전화번호는 비어 있으면 undefined로 보내 선택 입력처럼 처리합니다.
          phone: form.phone || undefined,
        },
        {
          // 상원: 회원가입은 캡챠 통과 토큰이 헤더에 있어야 진행되도록 보냅니다.
          headers: { 'X-Captcha-Token': captchaToken },
        },
      );
      if (response.status === 200 || response.status === 201) {
        // 상원: 회원가입 성공 직후 인증 상태를 확정해야 /favor 에서 관심사를 DB에 저장할 수 있습니다.
        await checkAuth(); // 상원
        alert('회원가입이 완료되었습니다!');
        navigate('/favor');
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const errorMsg =
        axiosError.response?.data?.detail || '회원가입에 실패했습니다.';
      alert(errorMsg);
    }
  };

  const isFormValid =
    form.email &&
    isEmailVerified &&
    form.password.length >= 8 &&
    form.name &&
    form.nickname &&
    isNicknameChecked &&
    captchaToken &&
    form.phone;

  return (
    <div className="mx-auto mt-10 mb-12 max-w-2xl rounded-xl border border-gray-100 bg-white p-10 shadow-lg">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">회원가입</h1>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* 이메일 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이메일
          </label>
          <div className="flex gap-2">
            <input
              name="email"
              type="email"
              placeholder="name@email.com"
              className={`w-full rounded-lg border p-3 focus:outline-none ${isEmailVerified ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:border-blue-500'}`}
              onChange={handleChange}
              disabled={isEmailVerified}
              required
            />
            <button
              type="button"
              onClick={handleCheckEmail}
              disabled={isEmailVerified}
              className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              중복검사
            </button>
            <button
              type="button"
              onClick={handleEmailRequest}
              disabled={!isEmailChecked || isEmailVerified}
              className="shrink-0 rounded-lg bg-gray-800 text-white px-4 py-2 font-medium hover:bg-gray-700 disabled:bg-gray-300"
            >
              인증요청
            </button>
          </div>
        </div>

        {/* 이메일 인증번호 */}
        {!isEmailVerified && isEmailChecked && (
          <div className="flex gap-2">
            <input
              name="email_code"
              type="text"
              placeholder="인증번호 6자리"
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={handleEmailVerify}
              className="shrink-0 rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
            >
              인증확인
            </button>
          </div>
        )}
        {isEmailVerified && (
          <p className="text-xs text-green-600 font-medium ml-1">
            이메일 인증이 완료되었습니다.
          </p>
        )}

        {/* 비밀번호 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            비밀번호
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="8자 이상"
              className="w-full rounded-lg border border-gray-300 p-3 pr-12 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
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

        {/* 이름 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이름
          </label>
          <input
            name="name"
            type="text"
            placeholder="실명 입력"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />
        </div>

        {/* 닉네임 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            닉네임
          </label>
          <div className="flex gap-2">
            <input
              name="nickname"
              type="text"
              placeholder="닉네임 입력"
              className={`w-full rounded-lg border p-3 focus:outline-none ${isNicknameChecked ? 'border-green-500' : 'border-gray-300 focus:border-blue-500'}`}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={handleCheckNickname}
              className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50"
            >
              중복검사
            </button>
          </div>
        </div>

        {/* 휴대폰 번호 (선택) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            휴대폰 번호
          </label>
          <input
            name="phone"
            type="tel"
            placeholder="010-0000-0000"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
          />
        </div>

        {/* 캡챠 인증 */}
        <div className="flex justify-center py-2">
          <CaptchaWidget
            // 상원: 캡챠 성공 시 발급받은 토큰을 회원가입 제출에 쓸 수 있게 상태에 저장합니다.
            onSuccess={(token) => setCaptchaToken(token)}
            // 상원: 회원가입용 캡챠가 실패하면 이전 통과 토큰을 지워서 다시 검증하게 합니다.
            onError={() => setCaptchaToken(null)}
            triggerType="register"
          />
        </div>

        {/* 버튼 */}
        <div className="space-y-3 pt-4">
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full rounded-xl py-4 font-bold text-white transition ${isFormValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            회원가입 완료
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-xl border border-blue-600 py-4 font-bold text-blue-600 hover:bg-blue-50 transition"
          >
            이미 계정이 있어요(로그인)
          </button>
        </div>
      </form>
    </div>
  );
}
