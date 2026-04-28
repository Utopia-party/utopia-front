import { useEffect, useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { updateMyReferrers } from '../../../apis/user';

const MAX_REFERRERS = 5;

type ReferrerEditModalProps = {
  open: boolean;
  onClose: () => void;
  initialReferrers: string[];
  onSaved: () => void;
};

export default function ReferrerEditModal({
  open,
  onClose,
  initialReferrers,
  onSaved,
}: ReferrerEditModalProps) {
  const [referrers, setReferrers] = useState<string[]>(['']);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    const values = initialReferrers.length > 0 ? initialReferrers : [''];
    setReferrers(values.slice(0, MAX_REFERRERS));
    setError('');
    setSaving(false);
  }, [open, initialReferrers]);

  if (!open) return null;

  const handleChange = (index: number, value: string) => {
    setReferrers((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
    setError('');
  };

  const handleAdd = () => {
    if (referrers.length >= MAX_REFERRERS) {
      setError('추천인은 최대 5명까지 등록할 수 있습니다.');
      return;
    }

    setReferrers((prev) => [...prev, '']);
  };

  const handleRemove = (index: number) => {
    setReferrers((prev) => {
      if (prev.length === 1) return [''];
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const values = referrers.map((item) => item.trim()).filter(Boolean);
    const uniqueValues = Array.from(new Set(values));

    if (values.length !== uniqueValues.length) {
      setError('중복된 추천인이 있습니다.');
      return;
    }

    if (uniqueValues.length > MAX_REFERRERS) {
      setError('추천인은 최대 5명까지 등록할 수 있습니다.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await updateMyReferrers({
        referrers: uniqueValues,
      });

      alert('추천인 정보가 변경되었습니다.');
      onSaved();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(
        axiosError.response?.data?.detail ||
          '추천인 정보 변경 중 오류가 발생했습니다.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              추천인 변경
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              추천인은 최대 5명까지 등록할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            {referrers.map((referrer, index) => {
              const isLast = index === referrers.length - 1;
              const canAdd = isLast && referrers.length < MAX_REFERRERS;

              return (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={referrer}
                    placeholder="추천인 닉네임"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-primary"
                    onChange={(e) => handleChange(index, e.target.value)}
                  />

                  {canAdd ? (
                    <button
                      type="button"
                      onClick={handleAdd}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
                      aria-label="추천인 추가"
                    >
                      <Plus size={20} />
                    </button>
                  ) : null}

                  {referrers.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-50"
                      aria-label="추천인 삭제"
                    >
                      <X size={18} />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {error ? (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              취소
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:bg-slate-300"
            >
              {saving ? '저장 중...' : '변경하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
