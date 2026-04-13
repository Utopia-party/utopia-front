import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router';
import { CaptchaWidget } from '../../components/captcha';
import { useAuthStore } from '../../stores/authStore';
import {
  checkEmail,
  requestEmailVerification,
  verifyEmailCode,
  checkNickname,
  signup,
} from '../../apis/auth';

export default function Signup() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    email_code: '',
    password: '',
    name: '',
    nickname: '',
    birth_date: '',
    phone: '',
    referrer: '',
  });

  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === 'phone') {
      newValue = value.replace(/[^0-9]/g, '');
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));

    if (name === 'email') {
      setIsEmailChecked(false);
      setIsEmailVerified(false);
    }

    if (name === 'password') {
      if (!validatePassword(value)) {
        setPasswordError('8자 이상, 영문/숫자/특수문자를 포함해야 합니다.');
      } else {
        setPasswordError('');
      }
    }

    if (name === 'nickname') {
      setIsNicknameChecked(false);
    }
  };

  const handleCheckEmail = async () => {
    if (!form.email) {
      alert('이메일을 입력해주세요.');
      return;
    }

    try {
      const data = await checkEmail(form.email);

      if (data.exists) {
        alert('이미 사용 중인 이메일입니다.');
        setIsEmailChecked(false);
      } else {
        alert('사용 가능한 이메일입니다. 이제 인증번호를 요청하세요.');
        setIsEmailChecked(true);
      }
    } catch {
      alert('중복 확인 중 오류가 발생했습니다.');
    }
  };

  const handleEmailRequest = async () => {
    if (!isEmailChecked) {
      alert('먼저 이메일 중복 확인을 해주세요.');
      return;
    }

    try {
      await requestEmailVerification(form.email);
      alert('인증 메일이 발송되었습니다. 메일함을 확인해주세요!');
    } catch {
      alert('인증 메일 발송에 실패했습니다.');
    }
  };

  const handleEmailVerify = async () => {
    if (!form.email_code) {
      alert('인증번호를 입력해주세요.');
      return;
    }

    try {
      const data = await verifyEmailCode(form.email, form.email_code);

      if (data.success) {
        alert('이메일 인증에 성공했습니다!');
        setIsEmailVerified(true);
      }
    } catch {
      alert('인증번호가 틀렸거나 만료되었습니다.');
    }
  };

  const validatePassword = (password: string) => {
    // 최소 8자 + 영문 + 숫자 + 특수문자
    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;

    return regex.test(password);
  };

  const handleCheckNickname = async () => {
    if (!form.nickname) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    try {
      const data = await checkNickname(form.nickname);

      if (data.exists) {
        alert('이미 사용 중인 닉네임입니다.');
        setIsNicknameChecked(false);
      } else {
        alert('사용 가능한 닉네임입니다.');
        setIsNicknameChecked(true);
      }
    } catch {
      alert('중복 확인 중 오류가 발생했습니다.');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');

    if (numbers.length < 4) return numbers;
    if (numbers.length < 8) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isEmailVerified || !isNicknameChecked) {
      alert('이메일 인증과 닉네임 중복 확인을 완료해주세요.');
      return;
    }

    if (!validatePassword(form.password)) {
      alert('비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.');
      return;
    }

    if (!captchaToken) {
      alert('캡챠 인증을 완료해주세요.');
      return;
    }

    try {
      await signup(
        {
          email: form.email,
          password: form.password,
          name: form.name,
          nickname: form.nickname,
          phone: form.phone,
          referrer: form.referrer || undefined,
        },
        captchaToken,
      );

      await checkAuth();
      alert('회원가입이 완료되었습니다!');
      navigate('/home');
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
    validatePassword(form.password) &&
    form.name &&
    form.nickname &&
    isNicknameChecked &&
    captchaToken &&
    form.phone;

  return (
    <div className="mx-auto mt-10 mb-12 max-w-2xl rounded-xl border border-gray-100 bg-white p-10 shadow-lg">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">회원가입</h1>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이메일 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              name="email"
              type="email"
              placeholder="name@email.com"
              className={`w-full rounded-lg border p-3 focus:outline-none ${
                isEmailVerified
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
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
              className="shrink-0 rounded-lg bg-gray-800 px-4 py-2 font-medium text-white hover:bg-gray-700 disabled:bg-gray-300"
            >
              인증요청
            </button>
          </div>
        </div>

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
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              인증확인
            </button>
          </div>
        )}

        {isEmailVerified && (
          <p className="ml-1 text-xs font-medium text-green-600">
            이메일 인증이 완료되었습니다.
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            비밀번호 <span className="text-red-500">*</span>
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
          {passwordError && (
            <p className="mt-1 text-xs text-red-500">{passwordError}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이름 <span className="text-red-500">*</span>
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

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            닉네임 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              name="nickname"
              type="text"
              placeholder="닉네임 입력"
              className={`w-full rounded-lg border p-3 focus:outline-none ${
                isNicknameChecked
                  ? 'border-green-500'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
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

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            휴대폰 번호 <span className="text-red-500">*</span>
          </label>
          <input
            name="phone"
            type="tel"
            placeholder="010-0000-0000"
            value={formatPhone(form.phone)}
            maxLength={13}
            inputMode="numeric"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            추천인 입력 (선택)
          </label>
          <div className="w-full">
            <input
              name="referrer"
              type="text"
              placeholder="추천인 닉네임 입력 (선택)"
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
            />
            <p className="mt-1 text-xs text-gray-400">
              &nbsp;추천인은 가입 후 변경할 수 없습니다.
            </p>
          </div>
        </div>

        <div className="flex justify-center py-2">
          <CaptchaWidget
            onSuccess={(token) => setCaptchaToken(token)}
            onError={() => setCaptchaToken(null)}
            triggerType="register"
          />
        </div>

        <div className="space-y-3 pt-4">
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full rounded-xl py-4 font-bold text-white transition ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'cursor-not-allowed bg-gray-300'
            }`}
          >
            회원가입 완료
          </button>
          {/* <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-xl border border-blue-600 py-4 font-bold text-blue-600 transition hover:bg-blue-50"
          >
            이미 계정이 있어요(로그인)
          </button> */}
        </div>
      </form>
    </div>
  );
}
