import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { CaptchaWidget } from '../../components/captcha';
import { useAuthStore } from '../../stores/authStore';
import {
  requestEmailVerification,
  verifyEmailCode,
  checkEmail,
  checkNickname,
  getRandomNickname,
  signup,
} from '../../apis/auth';

const DEFAULT_EMAIL_TIMER_SECONDS = 180;

const EMAIL_DOMAINS = [
  'gmail.com',
  'naver.com',
  'kakao.com',
  'daum.net',
  'hanmail.net',
  'nate.com',
];

export default function Signup() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    email_code: '',
    password: '',
    password_confirm: '',
    name: '',
    nickname: '',
    birth_date: '',
    phone: '010',
  });

  const [referrer, setReferrer] = useState('');

  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);
  const [isEmailRequesting, setIsEmailRequesting] = useState(false);
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);

  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [isNicknameGenerating, setIsNicknameGenerating] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateName = (name: string) => /^[A-Za-z가-힣]{2,20}$/.test(name);

  const validateNickname = (nickname: string) =>
    /^[A-Za-z0-9가-힣]{2,10}$/.test(nickname);

  const validatePassword = (password: string) =>
    /(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{}:;,.?~\\/-]).{8,}$/.test(
      password,
    );

  const validatePasswordConfirm = (password: string, passwordConfirm: string) =>
    password === passwordConfirm;

  const validatePhone = (phone: string) => /^010\d{8}$/.test(phone);

  const isNameValid = form.name && validateName(form.name);

  const getEmailSuggestions = () => {
    const [localPart, domainPart = ''] = form.email.split('@');

    if (!localPart || !form.email.includes('@') || isEmailVerified) return [];

    return EMAIL_DOMAINS.filter((domain) =>
      domain.startsWith(domainPart.toLowerCase()),
    ).map((domain) => `${localPart}@${domain}`);
  };

  const emailSuggestions = getEmailSuggestions();

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainSeconds = seconds % 60;

    return `${minutes}:${String(remainSeconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isEmailCodeSent || isEmailVerified || emailTimer <= 0) return;

    const timer = setInterval(() => {
      setEmailTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsEmailCodeSent(false);
          setEmailSuccess('');
          setEmailError(
            '인증 시간이 만료되었습니다. 다시 인증번호를 받아주세요.',
          );
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isEmailCodeSent, isEmailVerified, emailTimer]);

  const checkEmailAvailability = async (email: string) => {
    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      setEmailSuccess('');
      setIsEmailAvailable(false);
      return false;
    }

    if (!validateEmail(email)) {
      setEmailError('올바른 이메일 형식을 입력해주세요.');
      setEmailSuccess('');
      setIsEmailAvailable(false);
      return false;
    }

    try {
      setIsEmailChecking(true);
      setEmailError('');
      setEmailSuccess('');

      const data = await checkEmail(email);

      if (data.exists) {
        setEmailError('이미 가입된 이메일입니다.');
        setEmailSuccess('');
        setIsEmailAvailable(false);
        return false;
      }

      setEmailError('');
      setEmailSuccess('사용 가능한 이메일입니다. 인증하기 버튼을 눌러주세요.');
      setIsEmailAvailable(true);
      return true;
    } catch {
      setEmailError('이메일 확인 중 오류가 발생했습니다.');
      setEmailSuccess('');
      setIsEmailAvailable(false);
      return false;
    } finally {
      setIsEmailChecking(false);
    }
  };

  const handleEmailBlur = async () => {
    setTimeout(() => setShowEmailSuggestions(false), 150);

    if (!form.email || isEmailVerified) return;
    await checkEmailAvailability(form.email);
  };

  const handleEmailSuggestionClick = async (email: string) => {
    setForm((prev) => ({
      ...prev,
      email,
      email_code: '',
    }));

    setShowEmailSuggestions(false);
    setIsEmailCodeSent(false);
    setIsEmailVerified(false);
    setIsEmailAvailable(false);
    setEmailTimer(0);
    setEmailError('');
    setEmailSuccess('');

    await checkEmailAvailability(email);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === 'phone') {
      const numbers = value.replace(/[^0-9]/g, '').slice(0, 11);
      newValue = numbers.startsWith('010') ? numbers : `010${numbers.slice(3)}`;
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));

    if (name === 'email') {
      setIsEmailCodeSent(false);
      setIsEmailVerified(false);
      setIsEmailAvailable(false);
      setEmailTimer(0);
      setEmailSuccess('');
      setShowEmailSuggestions(value.includes('@'));

      setForm((prev) => ({
        ...prev,
        email: newValue,
        email_code: '',
      }));

      if (!value) {
        setEmailError('');
      } else if (!validateEmail(value)) {
        setEmailError('올바른 이메일 형식을 입력해주세요.');
      } else {
        setEmailError('');
      }

      return;
    }

    if (name === 'email_code') {
      setEmailError('');
    }

    if (name === 'password') {
      setPasswordError(
        validatePassword(value)
          ? ''
          : '8자 이상, 영문/숫자/특수문자를 포함해야 합니다.',
      );

      if (form.password_confirm) {
        setPasswordConfirmError(
          validatePasswordConfirm(value, form.password_confirm)
            ? ''
            : '비밀번호가 일치하지 않습니다.',
        );
      }
    }

    if (name === 'password_confirm') {
      if (!value) {
        setPasswordConfirmError('');
      } else if (!validatePasswordConfirm(form.password, value)) {
        setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
      } else {
        setPasswordConfirmError('');
      }
    }

    if (name === 'name') {
      if (!value) {
        setNameError('');
      } else if (!validateName(value)) {
        setNameError('이름은 2~20자, 한글/영문만 입력할 수 있습니다.');
      } else {
        setNameError('');
      }
    }

    if (name === 'nickname') {
      setIsNicknameChecked(false);
      setNicknameSuccess('');

      if (!value) {
        setNicknameError('');
      } else if (!validateNickname(value)) {
        setNicknameError(
          '닉네임은 2~10자, 한글/영문/숫자만 사용할 수 있습니다.',
        );
      } else {
        setNicknameError('');
      }
    }

    if (name === 'phone') {
      if (!newValue || newValue === '010') {
        setPhoneError('');
      } else if (newValue.length === 11 && validatePhone(newValue)) {
        setPhoneError('');
      } else {
        setPhoneError('010을 포함한 휴대폰 번호 11자리를 입력해주세요.');
      }
    }
  };

  useEffect(() => {
    if (!form.nickname) {
      setNicknameError('');
      setNicknameSuccess('');
      setIsNicknameChecked(false);
      return;
    }

    if (!validateNickname(form.nickname)) {
      setNicknameSuccess('');
      setIsNicknameChecked(false);
      return;
    }

    const currentNickname = form.nickname;

    const timer = setTimeout(async () => {
      try {
        const data = await checkNickname(currentNickname);

        if (currentNickname !== form.nickname) return;

        if (data.exists) {
          setNicknameError('이미 사용 중인 닉네임입니다.');
          setNicknameSuccess('');
          setIsNicknameChecked(false);
        } else {
          setNicknameError('');
          setNicknameSuccess('사용 가능한 닉네임입니다.');
          setIsNicknameChecked(true);
        }
      } catch {
        if (currentNickname !== form.nickname) return;
        setNicknameError('중복 확인 중 오류가 발생했습니다.');
        setNicknameSuccess('');
        setIsNicknameChecked(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.nickname]);

  const handleRandomNickname = async () => {
    try {
      setIsNicknameGenerating(true);
      setNicknameError('');
      setNicknameSuccess('');
      setIsNicknameChecked(false);

      const data = await getRandomNickname();

      setForm((prev) => ({
        ...prev,
        nickname: data.nickname,
      }));

      setNicknameError('');
      setNicknameSuccess('사용 가능한 닉네임입니다.');
      setIsNicknameChecked(true);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };

      setNicknameError(
        axiosError.response?.data?.detail || '랜덤 닉네임 생성에 실패했습니다.',
      );
      setNicknameSuccess('');
      setIsNicknameChecked(false);
    } finally {
      setIsNicknameGenerating(false);
    }
  };

  const handleEmailRequest = async () => {
    const available = isEmailAvailable
      ? true
      : await checkEmailAvailability(form.email);

    if (!available) return;

    try {
      setIsEmailRequesting(true);
      setEmailError('');
      setEmailSuccess('');

      const data = await requestEmailVerification(form.email);

      setEmailSuccess('인증번호를 발송했습니다.');
      setIsEmailCodeSent(true);
      setIsEmailVerified(false);
      setEmailTimer(data?.expires_in || DEFAULT_EMAIL_TIMER_SECONDS);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };

      setEmailError(
        axiosError.response?.data?.detail || '인증번호 발송에 실패했습니다.',
      );
      setEmailSuccess('');
      setIsEmailCodeSent(false);
      setEmailTimer(0);
    } finally {
      setIsEmailRequesting(false);
    }
  };

  const handleEmailVerify = async () => {
    if (!form.email_code) {
      setEmailError('인증번호를 입력해주세요.');
      return;
    }

    if (emailTimer <= 0) {
      setEmailError('인증 시간이 만료되었습니다. 다시 인증번호를 받아주세요.');
      setIsEmailCodeSent(false);
      return;
    }

    try {
      const data = await verifyEmailCode(form.email, form.email_code);

      if (data.success) {
        setIsEmailVerified(true);
        setIsEmailCodeSent(false);
        setEmailTimer(0);
        setEmailError('');
        setEmailSuccess('이메일 인증이 완료되었습니다.');
      }
    } catch {
      setEmailError('인증번호가 틀렸거나 만료되었습니다.');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '').slice(0, 11);

    if (numbers.length < 4) return numbers;
    if (numbers.length < 8) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
      7,
      11,
    )}`;
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

    if (!validatePasswordConfirm(form.password, form.password_confirm)) {
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

  const isFormValid =
    form.email &&
    !emailError &&
    isEmailVerified &&
    validatePassword(form.password) &&
    form.password_confirm &&
    validatePasswordConfirm(form.password, form.password_confirm) &&
    !passwordConfirmError &&
    form.name &&
    validateName(form.name) &&
    !nameError &&
    form.nickname &&
    !nicknameError &&
    isNicknameChecked &&
    form.phone &&
    validatePhone(form.phone) &&
    !phoneError &&
    captchaToken;

  return (
    <div className="mx-auto mt-10 mb-12 max-w-2xl rounded-xl border border-gray-100 bg-white p-10 shadow-lg">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">회원가입</h1>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이메일 <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              name="email"
              type="email"
              placeholder="name@email.com"
              value={form.email}
              className={`w-full rounded-lg border p-3 pr-32 focus:outline-none disabled:opacity-100 disabled:text-gray-900 ${
                emailError
                  ? 'border-red-500 bg-red-50'
                  : isEmailVerified || isEmailAvailable
                    ? 'border-blue-500 bg-blue-50 disabled:bg-blue-50'
                    : 'border-gray-300 focus:border-blue-500'
              }`}
              onChange={handleChange}
              onFocus={() => {
                if (form.email.includes('@')) setShowEmailSuggestions(true);
              }}
              onBlur={handleEmailBlur}
              disabled={isEmailVerified || isEmailRequesting}
              required
            />

            <button
              type="button"
              onClick={handleEmailRequest}
              disabled={
                !form.email ||
                !validateEmail(form.email) ||
                isEmailVerified ||
                isEmailRequesting ||
                isEmailChecking
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:bg-gray-300"
            >
              {isEmailChecking
                ? '확인 중'
                : isEmailRequesting
                  ? '발송 중'
                  : isEmailVerified
                    ? '인증완료'
                    : isEmailCodeSent
                      ? '재전송'
                      : '인증하기'}
            </button>

            {showEmailSuggestions && emailSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                {emailSuggestions.map((email) => (
                  <button
                    key={email}
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onMouseDown={() => handleEmailSuggestionClick(email)}
                  >
                    {email}
                  </button>
                ))}
              </div>
            )}
          </div>

          {emailError && (
            <p className="mt-1 text-xs text-red-500">{emailError}</p>
          )}

          {!emailError && emailSuccess && (
            <p className="mt-1 text-xs text-blue-600">{emailSuccess}</p>
          )}
        </div>

        {!isEmailVerified && isEmailCodeSent && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              인증번호 <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                name="email_code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="인증번호 6자리"
                value={form.email_code}
                className={`w-full rounded-lg border p-3 pr-20 focus:outline-none ${
                  form.email_code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                onChange={handleChange}
              />

              <button
                type="button"
                onClick={handleEmailVerify}
                disabled={!form.email_code || emailTimer <= 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                확인
              </button>
            </div>

            <div className="mt-1 flex items-center justify-between text-xs">
              <p className="text-blue-500">
                이메일로 받은 6자리 인증번호를 입력해주세요.
              </p>

              <p
                className={emailTimer <= 30 ? 'text-red-500' : 'text-blue-600'}
              >
                남은 시간 {formatTimer(emailTimer)}
              </p>
            </div>
          </div>
        )}

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
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
              value={form.password_confirm}
              className={`w-full rounded-lg border p-3 pr-12 focus:outline-none ${
                passwordConfirmError
                  ? 'border-red-500 bg-red-50'
                  : form.password_confirm &&
                      validatePasswordConfirm(
                        form.password,
                        form.password_confirm,
                      )
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 focus:border-blue-500'
              }`}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              onClick={() => setShowPasswordConfirm((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {passwordConfirmError && (
            <p className="mt-1 text-xs text-red-500">{passwordConfirmError}</p>
          )}

          {!passwordConfirmError &&
            form.password_confirm &&
            validatePasswordConfirm(form.password, form.password_confirm) && (
              <p className="mt-1 text-xs text-blue-600">
                비밀번호가 일치합니다.
              </p>
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

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            닉네임 <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              name="nickname"
              type="text"
              placeholder="닉네임 입력"
              value={form.nickname}
              className={`w-full rounded-lg border p-3 pr-28 focus:outline-none ${
                nicknameError
                  ? 'border-red-500 bg-red-50'
                  : isNicknameChecked
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 focus:border-blue-500'
              }`}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              onClick={handleRandomNickname}
              disabled={isNicknameGenerating}
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:bg-gray-300"
            >
              <Shuffle size={14} />
              {isNicknameGenerating ? '생성 중' : '랜덤'}
            </button>
          </div>

          {nicknameError && (
            <p className="mt-1 text-xs text-red-500">{nicknameError}</p>
          )}

          {!nicknameError && nicknameSuccess && (
            <p className="mt-1 text-xs text-blue-600">{nicknameSuccess}</p>
          )}
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
            className={`w-full rounded-lg border p-3 focus:outline-none ${
              phoneError
                ? 'border-red-500 bg-red-50'
                : form.phone && validatePhone(form.phone)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 focus:border-blue-500'
            }`}
            onChange={handleChange}
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
            {/* <p className="text-sm font-medium text-gray-600">
      자동 가입 방지를 위해 캡챠 인증을 완료해주세요.
    </p> */}
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
          {!captchaToken ? '가입하기' : '가입하기'}
        </button>
      </form>
    </div>
  );
}
