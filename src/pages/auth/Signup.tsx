import { type FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router';
import { CaptchaWidget } from '../../components/captcha';
import { useAuthStore } from '../../stores/authStore';
import { signup } from '../../apis/auth';
import { useSignupForm, formatPhone, validatePassword } from './components/useSignupForm';
import { EmailField } from './components/EmailField';
import { NicknameField } from './components/NicknameField';

export default function Signup() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const {
    form, referrer, setReferrer,
    isEmailRequesting, isEmailCodeSent, isEmailVerified, emailTimer,
    isNicknameChecked,
    isNicknameGenerating,
    showPassword, setShowPassword,
    passwordError, nicknameError, nicknameSuccess, emailError, emailSuccess, nameError,
    handleChange, handleRandomNickname, handleEmailRequest, handleEmailVerify,
    isFormValid,
  } = useSignupForm();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEmailVerified || !isNicknameChecked) { alert('이메일 인증과 닉네임 중복 확인을 완료해주세요.'); return; }
    if (!validatePassword(form.password)) { alert('비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.'); return; }
    if (!captchaToken) { alert('캡챠 인증을 완료해주세요.'); return; }
    const trimmedReferrer = referrer.trim();
    try {
      await signup(
        { email: form.email, password: form.password, name: form.name, nickname: form.nickname, phone: form.phone, referrers: trimmedReferrer ? [trimmedReferrer] : [] },
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

  return (
    <div className="mx-auto mt-10 mb-12 max-w-2xl rounded-xl border border-gray-100 bg-white p-10 shadow-lg">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">회원가입</h1>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <EmailField
          email={form.email} emailCode={form.email_code}
          isEmailRequesting={isEmailRequesting} isEmailCodeSent={isEmailCodeSent}
          isEmailVerified={isEmailVerified} emailTimer={emailTimer}
          emailError={emailError} emailSuccess={emailSuccess}
          onChange={handleChange} onRequest={handleEmailRequest} onVerify={handleEmailVerify}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              name="password" type={showPassword ? 'text' : 'password'} placeholder="8자 이상"
              className="w-full rounded-lg border border-gray-300 p-3 pr-12 focus:border-blue-500 focus:outline-none"
              onChange={handleChange} required
            />
            <button type="button" onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이름 <span className="text-red-500">*</span>
          </label>
          <input name="name" type="text" placeholder="실명 입력"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange} required />
          {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
        </div>

        <NicknameField
          nickname={form.nickname} nicknameError={nicknameError} nicknameSuccess={nicknameSuccess}
          isGenerating={isNicknameGenerating} onChange={handleChange} onRandom={handleRandomNickname}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            휴대폰 번호 <span className="text-red-500">*</span>
          </label>
          <input name="phone" type="tel" placeholder="010-0000-0000"
            value={formatPhone(form.phone)} maxLength={13} inputMode="numeric"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange} required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">추천인 입력 (선택)</label>
          <input type="text" value={referrer} placeholder="추천인 닉네임"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={(e) => setReferrer(e.target.value)} />
          <p className="mt-1 text-xs text-gray-400">추천인은 한 명만 입력할 수 있습니다.</p>
        </div>

        <div className="flex justify-center py-2">
          <CaptchaWidget onSuccess={(token) => setCaptchaToken(token)} onError={() => setCaptchaToken(null)} triggerType="register" />
        </div>

        <button
          type="submit" disabled={!isFormValid || !captchaToken}
          className={`w-full rounded-xl py-4 font-bold text-white transition ${isFormValid && captchaToken ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-gray-300'}`}
        >
          {!captchaToken ? '캡챠 인증 필요' : '회원가입 완료'}
        </button>
      </form>
    </div>
  );
}
