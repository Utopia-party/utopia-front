import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { requestEmailVerification, verifyEmailCode } from '../../apis/auth';
import { EmailField } from './components/EmailField';

type FindPasswordForm = {
  email: string;
  email_code: string;
};

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function FindPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FindPasswordForm>({
    email: '',
    email_code: '',
  });

  const [isEmailRequesting, setIsEmailRequesting] = useState(false);
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);

  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  useEffect(() => {
    if (!isEmailCodeSent || isEmailVerified || emailTimer <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setEmailTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isEmailCodeSent, isEmailVerified, emailTimer]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'email') {
      setIsEmailCodeSent(false);
      setIsEmailVerified(false);
      setEmailTimer(0);
      setEmailSuccess('');

      if (!value.trim()) {
        setEmailError('');
        return;
      }

      setEmailError(
        validateEmail(value.trim())
          ? ''
          : '올바른 이메일 형식으로 입력해주세요.',
      );
    }

    if (name === 'email_code') {
      setEmailError('');
    }
  };

  const handleEmailRequest = async () => {
    const email = form.email.trim();

    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      setEmailSuccess('');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('올바른 이메일 형식으로 입력해주세요.');
      setEmailSuccess('');
      return;
    }

    try {
      setIsEmailRequesting(true);
      setEmailError('');
      setEmailSuccess('');

      const response = await requestEmailVerification(email, 'reset-password');

      setIsEmailCodeSent(true);
      setIsEmailVerified(false);
      setEmailTimer(response.expires_in);
      setEmailSuccess('인증 메일이 발송되었습니다. 메일함을 확인해주세요.');
    } catch (error: unknown) {
      const e = error as {
        response?: { data?: { detail?: string; message?: string } };
      };

      setIsEmailCodeSent(false);
      setIsEmailVerified(false);
      setEmailTimer(0);
      setEmailSuccess('');
      setEmailError(
        e.response?.data?.detail ||
          e.response?.data?.message ||
          '인증 메일 발송에 실패했습니다.',
      );
    } finally {
      setIsEmailRequesting(false);
    }
  };

  const handleEmailVerify = async () => {
    const email = form.email.trim();
    const code = form.email_code.trim();

    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }

    if (!code) {
      setEmailError('인증번호를 입력해주세요.');
      return;
    }

    try {
      setEmailError('');
      setEmailSuccess('');

      const response = await verifyEmailCode(email, code, 'reset-password');

      if (response.success) {
        setIsEmailVerified(true);
        setEmailTimer(0);
        setEmailSuccess('이메일 인증이 완료되었습니다.');

        navigate('/reset-password', {
          state: { email },
        });
      }
    } catch (error: unknown) {
      const e = error as {
        response?: { data?: { detail?: string; message?: string } };
      };

      setIsEmailVerified(false);
      setEmailSuccess('');
      setEmailError(
        e.response?.data?.detail ||
          e.response?.data?.message ||
          '인증번호가 틀렸거나 만료되었습니다.',
      );
    }
  };

  return (
    <div className="mx-auto mt-10 mb-12 max-w-2xl rounded-xl border border-gray-100 bg-white p-10 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">비밀번호 찾기</h1>

      <p className="mb-8 text-sm text-gray-500">
        가입한 이메일을 입력하고 이메일 인증을 완료해주세요.
      </p>

      <EmailField
        className="mx-auto max-w-lg"
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

      <div className="mt-8 flex justify-center gap-2 text-sm text-gray-500">
        <Link to="/login" className="hover:underline">
          로그인
        </Link>
        <span>|</span>
        <Link to="/find-id" className="hover:underline">
          아이디 찾기
        </Link>
        <span>|</span>
        <Link to="/signup" className="hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}
