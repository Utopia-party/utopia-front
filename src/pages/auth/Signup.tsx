import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router';
import { CaptchaWidget } from '../../components/captcha';
import { useAuthStore } from '../../stores/authStore';
import { signup } from '../../apis/auth';
import { EmailField } from './components/EmailField';
import { NicknameField } from './components/NicknameField';
import {
  formatPhone,
  useSignupForm,
  validateName,
  validatePassword,
} from './components/useSignupForm';

function validatePasswordConfirm(password: string, passwordConfirm: string) {
  return password === passwordConfirm;
}

function validatePhone(phone: string) {
  return /^010\d{8}$/.test(phone);
}

export default function Signup() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();

  const {
    form,
    referrer,
    setReferrer,
    isEmailRequesting,
    isEmailCodeSent,
    isEmailVerified,
    emailTimer,
    isNicknameChecked,
    isNicknameGenerating,
    showPassword,
    setShowPassword,
    passwordError,
    nicknameError,
    nicknameSuccess,
    emailError,
    emailSuccess,
    nameError,
    handleChange,
    handleRandomNickname,
    handleEmailRequest,
    handleEmailVerify,
  } = useSignupForm();

  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const isNameValid = !!form.name && validateName(form.name);
  const isPasswordConfirmValid =
    !!passwordConfirm &&
    validatePasswordConfirm(form.password, passwordConfirm);
  const isPhoneValid = !!form.phone && validatePhone(form.phone);

  const handlePasswordConfirmChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setPasswordConfirm(value);

    if (!value) {
      setPasswordConfirmError('');
      return;
    }

    setPasswordConfirmError(
      validatePasswordConfirm(form.password, value)
        ? ''
        : '비밀번호가 일치하지 않습니다.',
    );
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);

    const phone = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);

    if (!phone) {
      setPhoneError('');
      return;
    }

    setPhoneError(
      validatePhone(phone)
        ? ''
        : '010을 포함한 휴대폰 번호 11자리를 입력해주세요.',
    );
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

    if (!validatePasswordConfirm(form.password, passwordConfirm)) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!validatePhone(form.phone)) {
      alert('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    if (!captchaToken) {
      alert('캡챠 인증을 완료해주세요.');
      return;
    }

    const trimmedReferrer = referrer.trim();

    try {
      await signup(
        {
          email: form.email,
          password: form.password,
          name: form.name,
          nickname: form.nickname,
          phone: form.phone,
          referrers: trimmedReferrer ? [trimmedReferrer] : [],
        },
        captchaToken,
      );

      await checkAuth();
      alert('회원가입이 완료되었습니다!');
      navigate('/home');
    } catch (error: unknown) {
      const e = error as { response?: { data?: { detail?: string } } };
      alert(e.response?.data?.detail || '회원가입에 실패했습니다.');
    }
  };

  const isFormValid = !!(
    form.email &&
    !emailError &&
    isEmailVerified &&
    validatePassword(form.password) &&
    passwordConfirm &&
    isPasswordConfirmValid &&
    !passwordConfirmError &&
    form.name &&
    isNameValid &&
    !nameError &&
    form.nickname &&
    !nicknameError &&
    isNicknameChecked &&
    form.phone &&
    isPhoneValid &&
    !phoneError &&
    captchaToken
  );

  return (
    <div className="mx-auto mt-10 mb-12 max-w-2xl rounded-xl border border-gray-100 bg-white p-10 shadow-lg">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">회원가입</h1>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <EmailField
          email={form.email}
          emailCode={form.email_code}
          isEmailRequesting={isEmailRequesting}
          isEmailCodeSent={isEmailCodeSent}
          isEmailVerified={isEmailVerified}
          emailTimer={emailTimer}
          emailError={emailError}
          emailSuccess={emailSuccess}
          onChange={handleChange}
          onRequest={handleEmailRequest}
          onVerify={handleEmailVerify}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            비밀번호 <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="8자 이상, 영문/숫자/특수문자 포함"
              value={form.password}
              className={`w-full rounded-lg border p-3 pr-12 focus:outline-none ${
                passwordError
                  ? 'border-red-500 bg-red-50'
                  : form.password && validatePassword(form.password)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 focus:border-blue-500'
              }`}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label="비밀번호 보기 전환"
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
            비밀번호 재확인 <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              name="password_confirm"
              type={showPasswordConfirm ? 'text' : 'password'}
              placeholder="비밀번호를 다시 입력해주세요"
              value={passwordConfirm}
              className={`w-full rounded-lg border p-3 pr-12 focus:outline-none ${
                passwordConfirmError
                  ? 'border-red-500 bg-red-50'
                  : isPasswordConfirmValid
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 focus:border-blue-500'
              }`}
              onChange={handlePasswordConfirmChange}
              required
            />

            <button
              type="button"
              onClick={() => setShowPasswordConfirm((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label="비밀번호 재확인 보기 전환"
            >
              {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {passwordConfirmError && (
            <p className="mt-1 text-xs text-red-500">{passwordConfirmError}</p>
          )}

          {!passwordConfirmError && isPasswordConfirmValid && (
            <p className="mt-1 text-xs text-blue-600">비밀번호가 일치합니다.</p>
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
            value={form.name}
            className={`w-full rounded-lg border p-3 focus:outline-none ${
              nameError
                ? 'border-red-500 bg-red-50'
                : isNameValid
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 focus:border-blue-500'
            }`}
            onChange={handleChange}
            required
          />

          {nameError && (
            <p className="mt-1 text-xs text-red-500">{nameError}</p>
          )}
        </div>

        <NicknameField
          nickname={form.nickname}
          nicknameError={nicknameError}
          nicknameSuccess={nicknameSuccess}
          isGenerating={isNicknameGenerating}
          onChange={handleChange}
          onRandom={handleRandomNickname}
        />

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
            className={`w-full rounded-lg border p-3 focus:outline-none ${
              phoneError
                ? 'border-red-500 bg-red-50'
                : isPhoneValid
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 focus:border-blue-500'
            }`}
            onChange={handlePhoneChange}
            required
          />

          {phoneError && (
            <p className="mt-1 text-xs text-red-500">{phoneError}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            추천인 입력 (선택)
          </label>

          <input
            type="text"
            value={referrer}
            placeholder="추천인 닉네임"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={(e) => setReferrer(e.target.value)}
          />

          <p className="mt-1 text-xs text-gray-400">
            추천인은 한 명만 입력할 수 있습니다.
          </p>
        </div>

        <div>
          <div className="mb-2 text-center">
            {!captchaToken && (
              <p className="mt-1 text-xs text-red-600">
                캡챠 인증까지 완료하면 가입하기 버튼이 활성화됩니다.
              </p>
            )}
          </div>

          <div className="flex justify-center py-2">
            <CaptchaWidget
              onSuccess={(token) => setCaptchaToken(token)}
              onError={() => setCaptchaToken(null)}
              triggerType="register"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full rounded-xl py-4 font-bold text-white transition ${
            isFormValid
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'cursor-not-allowed bg-gray-300'
          }`}
        >
          가입하기
        </button>
      </form>
    </div>
  );
}
