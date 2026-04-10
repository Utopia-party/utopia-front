import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { findId } from '../../apis/auth';

type FindIdForm = {
  name: string;
  phone: string;
};

export default function FindId() {
  const [form, setForm] = useState<FindIdForm>({
    name: '',
    phone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === 'phone') {
      newValue = value.replace(/[^0-9]/g, '');
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');

    if (numbers.length < 4) return numbers;
    if (numbers.length < 8) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      alert('닉네임과 휴대폰 번호를 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFoundEmail(null);

      const response = await findId({
        name: form.name.trim(),
        phone: form.phone.trim(),
      });

      const email = response.email;

      if (!email) {
        alert(response?.message || '일치하는 계정을 찾지 못했습니다.');
        return;
      }

      setFoundEmail(email);
    } catch (error: any) {
      const message =
        error?.response?.detail ||
        error?.response?.message ||
        '이메일 찾기에 실패했습니다.';
      alert(message);
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
            닉네임
          </label>
          <input
            name="name"
            type="text"
            value={form.name}
            placeholder="닉네임 입력"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            휴대폰 번호
          </label>
          <input
            name="phone"
            type="tel"
            value={formatPhone(form.phone)}
            placeholder="010-0000-0000"
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
