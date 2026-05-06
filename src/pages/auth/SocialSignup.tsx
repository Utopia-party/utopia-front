import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import axios from 'axios';
import { socialSignup } from '../../apis/auth';
import { useAuthStore } from '../../stores/authStore';
import type { SocialSignupLocationState } from '../../types/auth';

// 소셜로그인 추가 정보 입력 페이지(닉네임, 전화번호)

export default function SocialSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuthStore();

  const socialData = location.state as SocialSignupLocationState | null;

  const [form, setForm] = useState({
    nickname: '',
    phone: '',
  });

  const [errors, setErrors] = useState({
    nickname: '',
    phone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!socialData) {
    navigate('/login', { replace: true });
    return null;
  }

  const validateNickname = (nickname: string) => {
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      return '닉네임을 입력해주세요.';
    }

    if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
      return '닉네임은 2자 이상 12자 이하로 입력해주세요.';
    }

    const nicknameRegex = /^[가-힣a-zA-Z0-9_]+$/;

    if (!nicknameRegex.test(trimmedNickname)) {
      return '닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.';
    }

    return '';
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/[^0-9]/g, '');

    if (!numbers) {
      return '전화번호를 입력해주세요.';
    }

    if (!/^010[0-9]{8}$/.test(numbers)) {
      return '전화번호는 010으로 시작하는 11자리 숫자여야 합니다.';
    }

    return '';
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === 'phone') {
      newValue = value.replace(/[^0-9]/g, '').slice(0, 11);
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));

    if (name === 'nickname') {
      setErrors((prev) => ({
        ...prev,
        nickname: validateNickname(newValue),
      }));
    }

    if (name === 'phone') {
      setErrors((prev) => ({
        ...prev,
        phone: validatePhone(newValue),
      }));
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');

    if (numbers.length < 4) return numbers;
    if (numbers.length < 8) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
      7,
      11,
    )}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nickname = form.nickname.trim();
    const phone = form.phone.replace(/[^0-9]/g, '');

    const nicknameError = validateNickname(nickname);
    const phoneError = validatePhone(phone);

    if (nicknameError || phoneError) {
      setErrors({
        nickname: nicknameError,
        phone: phoneError,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await socialSignup({
        oauth: socialData.oauth,
        oauth_id: socialData.oauth_id,
        email: socialData.email,
        name: socialData.name,
        nickname,
        phone,
      });

      await checkAuth();

      navigate('/home', { replace: true });
    } catch (error: unknown) {
      let errorMessage = '회원가입에 실패했습니다.';

      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (errorMessage.includes('닉네임')) {
        setErrors((prev) => ({
          ...prev,
          nickname: errorMessage,
        }));
        return;
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border-2 border-gray-200 bg-white p-10 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">추가 정보 입력</h1>

      <p className="mb-8 text-sm text-gray-500">
        소셜 로그인은 완료되었습니다. 서비스 이용을 위해 정보를 입력해주세요.
      </p>

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            닉네임 <span className="text-red-500">*</span>
          </label>

          <input
            name="nickname"
            type="text"
            value={form.nickname}
            placeholder="닉네임 입력"
            className={`w-full rounded-lg border p-3 focus:outline-none ${
              errors.nickname
                ? 'border-red-400 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
            onChange={handleChange}
          />

          {errors.nickname && (
            <p className="mt-1 text-sm text-red-500">{errors.nickname}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            전화번호 <span className="text-red-500">*</span>
          </label>

          <input
            name="phone"
            type="text"
            value={formatPhone(form.phone)}
            placeholder="010-1234-5678"
            className={`w-full rounded-lg border p-3 focus:outline-none ${
              errors.phone
                ? 'border-red-400 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
            onChange={handleChange}
          />

          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? '가입 중...' : '가입 완료'}
        </button>
      </form>
    </div>
  );
}
