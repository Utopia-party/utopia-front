import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { api } from '../libs/api';

type FindPasswordForm = {
  email: string;
  name: string;
};

export default function FindPassword() {
  const [form, setForm] = useState<FindPasswordForm>({
    email: '',
    name: '',
  });

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
      alert('이메일과 이름을 입력해주세요.');
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

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border-2 border-gray-200 bg-white p-10 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">비밀번호 찾기</h1>
      <p className="mb-8 text-sm text-gray-500">
        가입한 이메일과 이름을 입력하면 비밀번호 재설정 안내를 받을 수 있어요.
      </p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이메일
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            placeholder="example@email.com"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />
        </div>

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
