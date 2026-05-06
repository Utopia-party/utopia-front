import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { resetPassword } from '../../apis/auth';

type ResetPasswordForm = {
  new_password: string;
  confirm_password: string;
};

type LocationState = {
  email?: string;
};

type FormErrors = {
  email?: string;
  new_password?: string;
  confirm_password?: string;
  submit?: string;
};

type TouchedState = {
  new_password: boolean;
  confirm_password: boolean;
};

const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]).{8,}$/;

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

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const isPasswordValid = !!form.new_password && !passwordError;
  const isConfirmPasswordValid =
    !!form.confirm_password && !confirmPasswordError;

  const isFormValid = isPasswordValid && isConfirmPasswordValid && !!email;

  const isSamePasswordError =
    errors.submit === '이전 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.';

  const getInputClassName = (hasError: boolean, isValid: boolean) => {
    if (hasError) {
      return 'border-red-500 bg-red-50 focus:border-red-500';
    }

    if (isValid) {
      return 'border-blue-500 bg-blue-50 focus:border-blue-500';
    }

    return 'border-gray-300 focus:border-blue-500';
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      submit: '',
    }));
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = '비밀번호 찾기 인증 후 다시 진행해주세요.';
    }

    if (passwordError) {
      newErrors.new_password = passwordError;
    }

    if (confirmPasswordError) {
      newErrors.confirm_password = confirmPasswordError;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setTouched({
      new_password: true,
      confirm_password: true,
    });

    setErrors({});

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      await resetPassword({
        email,
        new_password: form.new_password.trim(),
      });

      setIsSuccess(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        '비밀번호 재설정에 실패했습니다.';

      setErrors({
        submit: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto mt-10 mb-12 max-w-xl rounded-xl border border-gray-100 bg-white p-10 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <span className="text-3xl font-bold text-blue-600">✓</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            비밀번호 변경 완료
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            비밀번호가 성공적으로 변경되었습니다.
            <br />새 비밀번호로 다시 로그인해주세요.
          </p>

          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-8 w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 mb-12 max-w-xl rounded-xl border border-gray-100 bg-white p-10 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">비밀번호 재설정</h1>

      <p className="mb-8 text-sm text-gray-500">새 비밀번호를 입력해주세요.</p>

      {errors.email && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{errors.email}</p>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            새 비밀번호 <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              name="new_password"
              type={showNewPassword ? 'text' : 'password'}
              value={form.new_password}
              placeholder="8자 이상, 영문/숫자/특수문자 포함"
              className={`w-full rounded-lg border p-3 pr-12 focus:outline-none ${getInputClassName(
                ((touched.new_password || !!errors.new_password) &&
                  !!passwordError) ||
                  isSamePasswordError,
                isPasswordValid && !isSamePasswordError,
              )}`}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={
                showNewPassword ? '새 비밀번호 숨기기' : '새 비밀번호 보기'
              }
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {(touched.new_password || errors.new_password) && passwordError && (
            <p className="mt-1 text-xs text-red-500">{passwordError}</p>
          )}

          {isSamePasswordError && (
            <p className="mt-1 text-xs text-red-500">
              이전 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.
            </p>
          )}

          {isPasswordValid && !isSamePasswordError && (
            <p className="mt-1 text-xs text-blue-600">
              사용 가능한 비밀번호 형식입니다.
            </p>
          )}

          {!form.new_password && !errors.new_password && (
            <p className="mt-1 text-xs text-gray-400">
              8자 이상, 영문/숫자/특수문자를 포함해주세요.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            새 비밀번호 확인 <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              name="confirm_password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirm_password}
              placeholder="비밀번호를 다시 입력해주세요"
              className={`w-full rounded-lg border p-3 pr-12 focus:outline-none ${getInputClassName(
                (touched.confirm_password || !!errors.confirm_password) &&
                  !!confirmPasswordError,
                isConfirmPasswordValid,
              )}`}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={
                showConfirmPassword
                  ? '비밀번호 확인 숨기기'
                  : '비밀번호 확인 보기'
              }
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {(touched.confirm_password || errors.confirm_password) &&
            confirmPasswordError && (
              <p className="mt-1 text-xs text-red-500">
                {confirmPasswordError}
              </p>
            )}

          {isConfirmPasswordValid && (
            <p className="mt-1 text-xs text-blue-600">비밀번호가 일치합니다.</p>
          )}
        </div>

        {errors.submit && !isSamePasswordError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`w-full rounded-xl py-4 font-bold text-white transition ${
            isFormValid && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'cursor-not-allowed bg-gray-300'
          }`}
        >
          {isSubmitting ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>

      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
        <Link to="/login" className="hover:text-blue-600 hover:underline">
          로그인
        </Link>

        <span className="text-gray-300">|</span>

        <Link to="/find-id" className="hover:text-blue-600 hover:underline">
          이메일 찾기
        </Link>

        <span className="text-gray-300">|</span>

        <Link to="/signup" className="hover:text-blue-600 hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}
