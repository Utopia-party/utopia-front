import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { api } from '../libs/api';
import { useAuthStore } from '../stores/authStore';

// 소셜로그인 추가 정보 입력 페이지(닉네임, 전화번호(선택))

type SocialState = {
  oauth: string;
  oauth_id: string;
  email: string | null;
  name: string | null;
};

export default function SocialSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuthStore();
  const socialData = location.state as SocialState | null;

  const [form, setForm] = useState({
    nickname: '',
    phone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ❗ 잘못된 접근 방지 (직접 URL 접근)
  if (!socialData) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.nickname.trim()) {
      alert('닉네임은 필수 입력입니다.');
      return;
    }

    try {
      setIsSubmitting(true);

      await api.post('/api/auth/social/signup', {
        oauth: socialData.oauth,
        oauth_id: socialData.oauth_id,
        email: socialData.email,
        name: socialData.name,
        nickname: form.nickname.trim(),
        phone: form.phone || null,
      });

      // 로그인 상태 갱신
      await checkAuth();

      navigate('/home', { replace: true });
    } catch (error: any) {
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          '회원가입에 실패했습니다.',
      );
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

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* 닉네임 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            닉네임 <span className="text-red-500">*</span>
          </label>
          <input
            name="nickname"
            type="text"
            value={form.nickname}
            placeholder="닉네임 입력"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />
        </div>

        {/* 전화번호 (선택) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            전화번호 (선택)
          </label>
          <input
            name="phone"
            type="text"
            value={form.phone}
            placeholder="010-1234-5678"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
          />
        </div>

        {/* 버튼 */}
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
