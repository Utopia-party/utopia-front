import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { api } from '../libs/api';

type ResetPasswordForm = {
  password: string;
  password_confirm: string;
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';

  const [form, setForm] = useState<ResetPasswordForm>({
    password: '',
    password_confirm: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetDone, setIsResetDone] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = (password: string) => {
    const trimmed = password.trim();

    if (trimmed.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.';
    }

    return '';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      alert('유효하지 않은 비밀번호 재설정 링크입니다.');
      return;
    }

    if (!form.password || !form.password_confirm) {
      alert('새 비밀번호를 모두 입력해주세요.');
      return;
    }

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      alert(passwordError);
      return;
    }

    if (form.password !== form.password_confirm) {
      alert('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    try {
      setIsSubmitting(true);

      await api.post('/users/reset-password', {
        token,
        new_password: form.password.trim(),
      });

      setIsResetDone(true);
    } catch (error: unknown) {
      let message = '비밀번호 재설정에 실패했습니다.';

      if (typeof error === 'object' && error !== null) {
        const response = (
          error as {
            response?: {
              data?: {
                detail?: unknown;
                message?: unknown;
              };
            };
          }
        ).response;

        const detail = response?.data?.detail;
        const fallbackMessage = response?.data?.message;

        if (typeof detail === 'string') {
          message = detail;
        } else if (typeof fallbackMessage === 'string') {
          message = fallbackMessage;
        }
      }

      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveLogin = () => {
    navigate('/login');
  };

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border-2 border-gray-200 bg-white p-10 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">비밀번호 재설정</h1>
      <p className="mb-8 text-sm text-gray-500">
        새로운 비밀번호를 입력하고 저장해주세요.
      </p>

      {!token ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          유효하지 않거나 만료된 접근입니다. 비밀번호 찾기에서 다시
          요청해주세요.
        </div>
      ) : isResetDone ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-100 bg-green-50 p-5 text-sm text-green-700">
            비밀번호가 정상적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.
          </div>

          <button
            type="button"
            onClick={handleMoveLogin}
            className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700"
          >
            로그인하러 가기
          </button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              새 비밀번호
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              placeholder="새 비밀번호를 입력하세요"
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
              required
            />
            <p className="mt-2 ml-1 text-xs text-gray-500">
              8자 이상으로 입력해주세요.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              새 비밀번호 확인
            </label>
            <input
              name="password_confirm"
              type="password"
              value={form.password_confirm}
              placeholder="새 비밀번호를 다시 입력하세요"
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isSubmitting ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      )}

      <div className="mt-8 flex justify-center gap-2 text-sm text-gray-500">
        <Link to="/login" className="hover:underline">
          로그인
        </Link>
        <span>|</span>
        <Link to="/find-password" className="hover:underline">
          비밀번호 찾기
        </Link>
        <span>|</span>
        <Link to="/signup" className="hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}
