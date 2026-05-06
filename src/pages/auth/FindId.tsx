import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { findId } from '../../apis/auth';

type FindIdForm = {
  nickname: string;
  phone: string;
};

type FormErrors = {
  nickname?: string;
  phone?: string;
  submit?: string;
};

export default function FindId() {
  const [form, setForm] = useState<FindIdForm>({
    nickname: '',
    phone: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === 'phone') {
      newValue = value.replace(/[^0-9]/g, '').slice(0, 11);
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
      submit: '',
    }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');

    if (numbers.length < 4) return numbers;

    if (numbers.length < 8) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(
      3,
      7,
    )}-${numbers.slice(7, 11)}`;
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!form.nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    }

    if (!form.phone.trim()) {
      newErrors.phone = '휴대폰 번호를 입력해주세요.';
    } else if (form.phone.length < 11) {
      newErrors.phone = '올바른 휴대폰 번호를 입력해주세요.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setFoundEmail(null);

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const response = await findId({
        nickname: form.nickname.trim(),
        phone: form.phone.trim(),
      });

      const email = response.email;

      if (!email) {
        setErrors({
          submit: response?.message || '일치하는 계정을 찾지 못했습니다.',
        });
        return;
      }

      setFoundEmail(email);
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        '이메일 찾기에 실패했습니다.';

      setErrors({
        submit: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border-2 border-gray-200 bg-white p-10 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">이메일 찾기</h1>

      <p className="mb-8 text-sm text-gray-500">
        가입 시 입력한 닉네임과 휴대폰 번호로 아이디를 확인할 수 있어요.
      </p>

      <form className="space-y-6" onSubmit={handleSubmit}>
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
            휴대폰 번호 <span className="text-red-500">*</span>
          </label>

          <input
            name="phone"
            type="tel"
            value={formatPhone(form.phone)}
            placeholder="010-0000-0000"
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

        {errors.submit && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? '확인 중...' : '이메일 찾기'}
        </button>
      </form>

      {foundEmail && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm text-gray-600">조회된 이메일</p>

          <p className="mt-2 text-lg font-bold text-gray-800">{foundEmail}</p>
        </div>
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
