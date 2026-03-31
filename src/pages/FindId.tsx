import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { api } from '../libs/api';

type FindIdForm = {
  name: string;
  phone_number: string;
};

export default function FindId() {
  const [form, setForm] = useState<FindIdForm>({
    name: '',
    phone_number: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const maskEmail = (email: string) => {
    const [id, domain] = email.split('@');
    if (!domain) return email;

    if (id.length <= 2) {
      return `${id[0] ?? ''}*@${domain}`;
    }

    return `${id.slice(0, 2)}${'*'.repeat(Math.max(id.length - 2, 1))}@${domain}`;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone_number.trim()) {
      alert('이름과 휴대폰 번호를 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFoundEmail(null);

      const response = await api.post('/users/find-id', {
        name: form.name.trim(),
        phone_number: form.phone_number.trim(),
      });

      const email = response.data?.email;

      if (!email) {
        alert(response.data?.message || '일치하는 계정을 찾지 못했습니다.');
        return;
      }

      setFoundEmail(maskEmail(email));
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        '아이디 찾기에 실패했습니다.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border-2 border-gray-200 bg-white p-10 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">아이디 찾기</h1>
      <p className="mb-8 text-sm text-gray-500">
        가입 시 입력한 이름과 휴대폰 번호로 아이디를 확인할 수 있어요.
      </p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이름
          </label>
          <input
            name="name"
            type="text"
            value={form.name}
            placeholder="이름 입력"
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
            name="phone_number"
            type="tel"
            value={form.phone_number}
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
          {isSubmitting ? '확인 중...' : '아이디 찾기'}
        </button>
      </form>

      {foundEmail && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm text-gray-600">조회된 아이디</p>
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
