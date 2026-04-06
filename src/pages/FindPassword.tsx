import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { api } from '../libs/api';

type FindPasswordForm = {
  email: string;
  name: string;
  email_code?: string;
};

export default function FindPassword() {
  const [form, setForm] = useState<FindPasswordForm>({
    email: '',
    name: '',
    email_code: '',
  });

  const [isEmailChecked, setisEmailChecked] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequested, setIsRequested] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.email.trim() || !form.name.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setIsRequested(false);

      const response = await api.post('/users/find-password', {
        email: form.email.trim(),
        name: form.name.trim(),
      });

      alert(
        response.data?.message ||
          '비밀번호 재설정 안내를 요청했습니다. 이메일을 확인해주세요.',
      );
      setIsRequested(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        '비밀번호 찾기에 실패했습니다.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 이메일 인증 요청
  const handleEmailRequest = async () => {
    if (!form.email) return alert('이메일을 입력해주세요.');
    try {
      await api.post('/api/email-request', null, {
        params: { email: form.email },
      });
      alert('인증 메일이 발송되었습니다. 메일함을 확인해주세요!');
      setisEmailChecked(true);
    } catch {
      alert('인증 메일 발송에 실패했습니다.');
    }
  };

  // 이메일 인증 확인
  const handleEmailVerify = async () => {
    if (!form.email_code) return alert('인증번호를 입력해주세요.');
    try {
      const response = await api.post('/api/email-verify', null, {
        params: { email: form.email, code: form.email_code },
      });
      if (response.data.success) {
        alert('이메일 인증에 성공했습니다!');
        setIsEmailVerified(true);
      }
    } catch {
      alert('인증번호가 틀렸거나 만료되었습니다.');
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border-2 border-gray-200 bg-white p-10 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">비밀번호 찾기</h1>
      <p className="mb-8 text-sm text-gray-500">
        가입한 이메일을 입력하면 비밀번호 재설정 안내를 받을 수 있어요.
      </p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이메일
          </label>
          <div className="flex gap-2">
            <input
              name="email"
              type="email"
              value={form.email}
              placeholder="example@email.com"
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={handleEmailRequest}
              disabled={isEmailVerified}
              className="shrink-0 rounded-lg bg-gray-800 px-4 py-2 font-medium text-white hover:bg-gray-700 disabled:bg-gray-300"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? '요청 중...' : '비밀번호 재설정 요청'}
        </button>
      </form>

      {isRequested && (
        <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-5 text-sm text-green-700">
          비밀번호 재설정 요청이 완료되었습니다. 메일함을 확인해주세요.
        </div>
      )}

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
