import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { resetPassword } from '../../apis/auth';

type ResetPasswordForm = {
  new_password: string;
  confirm_password: string;
};

type LocationState = {
  email?: string;
};

type TouchedState = {
  new_password: boolean;
  confirm_password: boolean;
};

const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const email = state?.email ?? '';

  const [form, setForm] = useState<ResetPasswordForm>({
    new_password: '',
    confirm_password: '',
  });

  const [touched, setTouched] = useState<TouchedState>({
    new_password: false,
    confirm_password: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePassword = (password: string) => {
    if (!password.trim()) {
      return '새 비밀번호를 입력해주세요.';
    }

    if (!PASSWORD_REGEX.test(password)) {
      return '비밀번호는 8자 이상이며, 영문/숫자/특수문자를 포함해야 합니다.';
    }

    return '';
  };

  const validateConfirmPassword = (
    password: string,
    confirmPassword: string,
  ) => {
    if (!confirmPassword.trim()) {
      return '비밀번호 확인을 입력해주세요.';
    }

    if (password !== confirmPassword) {
      return '비밀번호가 일치하지 않습니다.';
    }

    return '';
  };

  const passwordError = validatePassword(form.new_password);
  const confirmPasswordError = validateConfirmPassword(
    form.new_password,
    form.confirm_password,
  );

  const isPasswordValid = !passwordError;
  const isConfirmPasswordValid = !confirmPasswordError;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      alert('잘못된 접근입니다. 비밀번호 찾기부터 다시 진행해주세요.');
      navigate('/find-password');
      return;
    }

    setTouched({
      new_password: true,
      confirm_password: true,
    });

    if (!isPasswordValid || !isConfirmPasswordValid) {
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
            className={`w-full rounded-lg border p-3 focus:outline-none ${
              touched.new_password && passwordError
                ? 'border-red-500 focus:border-red-500'
                : touched.new_password && isPasswordValid
                  ? 'border-green-500 focus:border-green-500'
                  : 'border-gray-300 focus:border-blue-500'
            }`}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />

          {touched.new_password && passwordError ? (
            <p className="mt-2 text-xs font-medium text-red-500">
              {passwordError}
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              8자 이상, 영문/숫자/특수문자를 포함해주세요.
            </p>
          )}
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
            className={`w-full rounded-lg border p-3 focus:outline-none ${
              touched.confirm_password && confirmPasswordError
                ? 'border-red-500 focus:border-red-500'
                : touched.confirm_password &&
                    form.confirm_password.trim() &&
                    !confirmPasswordError
                  ? 'border-green-500 focus:border-green-500'
                  : 'border-gray-300 focus:border-blue-500'
            }`}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />

          {touched.confirm_password && confirmPasswordError && (
            <p className="mt-2 text-xs font-medium text-red-500">
              {confirmPasswordError}
            </p>
          )}
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
