import { useState, type ChangeEvent, type FormEvent } from 'react';

type ProfileEditModalProps = {
  open: boolean;
  onClose: () => void;
  initialValues: {
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

type ProfileEditForm = {
  nickname: string;
  phone: string;
};

export default function ProfileEditModal({
  open,
  onClose,
  initialValues,
}: ProfileEditModalProps) {
  const [form, setForm] = useState<ProfileEditForm>({
    nickname: initialValues.nickname ?? '',
    phone: initialValues.phone ?? '',
  });

  if (!open) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('저장 (프로필 수정 API 연결 전입니다.)');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">프로필 수정</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm font-medium text-slate-500">
          회원 정보를 수정할 수 있습니다.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-600">
              이메일
            </label>
            <input
              type="email"
              value={initialValues.email ?? ''}
              disabled
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-600">
              닉네임
            </label>
            <input
              name="nickname"
              type="text"
              value={form.nickname}
              onChange={handleChange}
              placeholder="닉네임 입력"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-600">
              전화번호
            </label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="010-0000-0000"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
