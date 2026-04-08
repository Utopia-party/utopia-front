import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { resetPassword } from '../apis/auth';

type ResetPasswordForm = {
  new_password: string;
  confirm_password: string;
};

type LocationState = {
  email?: string;
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const email = state?.email ?? '';

  const [form, setForm] = useState<ResetPasswordForm>({
    new_password: '',
    confirm_password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      alert('잘못된 접근입니다. 비밀번호 찾기부터 다시 진행해주세요.');
      navigate('/find-password');
      return;
    }

    if (!form.new_password.trim()) {
      alert('새 비밀번호를 입력해주세요.');
      return;
    }

    if (form.new_password !== form.confirm_password) {
      alert('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await resetPassword({
        email,
        new_password: form.new_password.trim(),
      });

      alert(response.message || '비밀번호가 성공적으로 변경되었습니다.');
      navigate('/login');
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        '비밀번호 재설정에 실패했습니다.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border-2 border-gray-200 bg-white p-10 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">비밀번호 재설정</h1>
      <p className="mb-8 text-sm text-gray-500">
        새로운 비밀번호를 입력해주세요.
      </p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            새 비밀번호
          </label>
          <input
            name="new_password"
            type="password"
            value={form.new_password}
            placeholder="새 비밀번호를 입력해주세요"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />
          <p className="mt-2 text-xs text-gray-500">
            8자 이상, 영문/숫자/특수문자를 포함해주세요.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            새 비밀번호 확인
          </label>
          <input
            name="confirm_password"
            type="password"
            value={form.confirm_password}
            placeholder="비밀번호를 한 번 더 입력해주세요"
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

      <div className="mt-8 flex justify-center gap-2 text-sm text-gray-500">
        <Link to="/login" className="hover:underline">
          로그인
        </Link>
        <span>|</span>
        <Link to="/find-password" className="hover:underline">
          비밀번호 찾기
        </Link>
      </div>
    </div>
  );
}
