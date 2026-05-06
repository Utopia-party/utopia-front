import { useEffect, useState, type ChangeEvent } from 'react';
import {
  requestEmailVerification,
  verifyEmailCode,
  checkNickname,
  getRandomNickname,
} from '../../../apis/auth';

const DEFAULT_EMAIL_TIMER_SECONDS = 180;

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function validateName(name: string) {
  return /^[A-Za-z가-힣]{2,20}$/.test(name);
}
export function validateNickname(nickname: string) {
  return /^[A-Za-z0-9가-힣]{2,10}$/.test(nickname);
}
export function validatePassword(password: string) {
  return /(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{}:;,.?~\\/-]).{8,}$/.test(
    password,
  );
}

export function formatPhone(value: string) {
  const numbers = value.replace(/[^0-9]/g, '').slice(0, 11);
  if (numbers.length < 4) return numbers;
  if (numbers.length < 8) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

export function useSignupForm() {
  const [form, setForm] = useState({
    email: '',
    email_code: '',
    password: '',
    name: '',
    nickname: '',
    birth_date: '',
    phone: '',
  });
  const [referrer, setReferrer] = useState('');

  const [isEmailRequesting, setIsEmailRequesting] = useState(false);
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);

  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [isNicknameGenerating, setIsNicknameGenerating] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // 이메일 타이머
  useEffect(() => {
    if (!isEmailCodeSent || isEmailVerified || emailTimer <= 0) return;
    const timer = setInterval(() => {
      setEmailTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsEmailCodeSent(false);
          setEmailSuccess('');
          setEmailError('인증 시간이 만료되었습니다. 다시 인증요청 해주세요.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isEmailCodeSent, isEmailVerified, emailTimer]);

  // 닉네임 중복 검사 디바운스
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
    const cur = form.nickname;
    const timer = setTimeout(async () => {
      try {
        const data = await checkNickname(cur);
        if (cur !== form.nickname) return;
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
        if (cur !== form.nickname) return;
        setNicknameError('중복 확인 중 오류가 발생했습니다.');
        setNicknameSuccess('');
        setIsNicknameChecked(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.nickname]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'phone') newValue = value.replace(/[^0-9]/g, '').slice(0, 11);
    setForm((prev) => ({ ...prev, [name]: newValue }));

    if (name === 'email') {
      setIsEmailCodeSent(false);
      setIsEmailVerified(false);
      setEmailTimer(0);
      setEmailSuccess('');
      setEmailError(
        !value
          ? ''
          : !validateEmail(value)
            ? '올바른 이메일 형식을 입력해주세요.'
            : '',
      );
    }
    if (name === 'email_code') setEmailError('');
    if (name === 'password')
      setPasswordError(
        validatePassword(value)
          ? ''
          : '8자 이상, 영문/숫자/특수문자를 포함해야 합니다.',
      );
    if (name === 'name')
      setNameError(
        !value
          ? ''
          : !validateName(value)
            ? '이름은 2~20자, 한글/영문만 입력할 수 있습니다.'
            : '',
      );
    if (name === 'nickname') {
      setIsNicknameChecked(false);
      setNicknameSuccess('');
      setNicknameError(
        !value
          ? ''
          : !validateNickname(value)
            ? '닉네임은 2~10자, 한글/영문/숫자만 사용할 수 있습니다.'
            : '',
      );
    }
  };

  const handleRandomNickname = async () => {
    try {
      setIsNicknameGenerating(true);
      setNicknameError('');
      setNicknameSuccess('');
      setIsNicknameChecked(false);
      const data = await getRandomNickname();
      setForm((prev) => ({ ...prev, nickname: data.nickname }));
      setNicknameSuccess('사용 가능한 닉네임입니다.');
      setIsNicknameChecked(true);
    } catch (error: unknown) {
      const e = error as { response?: { data?: { detail?: string } } };
      setNicknameError(
        e.response?.data?.detail || '랜덤 닉네임 생성에 실패했습니다.',
      );
    } finally {
      setIsNicknameGenerating(false);
    }
  };

  const handleEmailRequest = async () => {
    if (!form.email) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }
    if (!validateEmail(form.email)) {
      setEmailError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    try {
      setIsEmailRequesting(true);
      setEmailError('');
      setEmailSuccess('');
      const data = await requestEmailVerification(form.email);
      setEmailSuccess('인증번호를 발송했습니다. 메일함을 확인해주세요.');
      setIsEmailCodeSent(true);
      setIsEmailVerified(false);
      setEmailTimer(data?.expires_in || DEFAULT_EMAIL_TIMER_SECONDS);
    } catch (error: unknown) {
      const e = error as { response?: { data?: { detail?: string } } };
      setEmailError(
        e.response?.data?.detail || '인증번호 발송에 실패했습니다.',
      );
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
      setEmailError('인증 시간이 만료되었습니다. 다시 인증요청 해주세요.');
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

  const isFormValid = !!(
    form.email &&
    !emailError &&
    isEmailVerified &&
    validatePassword(form.password) &&
    form.name &&
    !nameError &&
    form.nickname &&
    !nicknameError &&
    isNicknameChecked &&
    form.phone
  );

  return {
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
    isFormValid,
  };
}
