import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
  const [newReferrers, setNewReferrers] = useState<string[]>(['']);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const lockedReferrers = useMemo(
    () =>
      Array.from(
        new Set(initialReferrers.map((item) => item.trim()).filter(Boolean)),
      ).slice(0, MAX_REFERRERS),
    [initialReferrers],
  );

  const remainingCount = MAX_REFERRERS - lockedReferrers.length;

  useEffect(() => {
    if (!open) return;

    setNewReferrers(remainingCount > 0 ? [''] : []);
    setError('');
    setSaving(false);
  }, [open, remainingCount]);

  if (!open) return null;

  const handleChange = (index: number, value: string) => {
    setNewReferrers((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
    setError('');
  };

  const handleAdd = () => {
    if (newReferrers.length >= remainingCount) {
      setError(`추천인은 최대 ${MAX_REFERRERS}명까지 등록할 수 있습니다.`);
      return;
    }

    setNewReferrers((prev) => [...prev, '']);
    setError('');
  };

  const handleRemove = (index: number) => {
    setNewReferrers((prev) => {
      if (prev.length === 1) return [''];
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const addedValues = newReferrers.map((item) => item.trim()).filter(Boolean);
    const allValues = [...lockedReferrers, ...addedValues];
    const uniqueValues = Array.from(new Set(allValues));

    if (allValues.length !== uniqueValues.length) {
      setError('이미 등록된 추천인이거나 중복 입력된 추천인입니다.');
      return;
    }

    if (uniqueValues.length > MAX_REFERRERS) {
      setError(`추천인은 최대 ${MAX_REFERRERS}명까지 등록할 수 있습니다.`);
      return;
    }

    if (addedValues.length === 0) {
      setError('추가할 추천인을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await updateMyReferrers({
        referrers: uniqueValues,
      });

      alert('추천인이 추가되었습니다.');
      onSaved();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(
        axiosError.response?.data?.detail ||
          '추천인 추가 중 오류가 발생했습니다.',
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
              추천인 추가
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              기존 추천인은 수정할 수 없고, 최대 {MAX_REFERRERS}명까지 추가할 수
              있습니다.
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

        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-800">
                기존 추천인
              </p>
              <p className="text-xs font-bold text-slate-400">
                {lockedReferrers.length}/{MAX_REFERRERS}명
              </p>
            </div>

            {lockedReferrers.length > 0 ? (
              <div className="space-y-2">
                {lockedReferrers.map((referrer) => (
                  <div
                    key={referrer}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-bold text-slate-700">
                      {referrer}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-500">
                      수정 불가
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-400">
                아직 등록한 추천인이 없습니다.
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-800">
                새 추천인 추가
              </p>
              <p className="text-xs font-bold text-primary">
                추가 가능 {remainingCount}명
              </p>
            </div>

            {remainingCount <= 0 ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm font-semibold text-primary">
                이미 추천인을 최대 {MAX_REFERRERS}명까지 등록했습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {newReferrers.map((referrer, index) => {
                  const isLast = index === newReferrers.length - 1;
                  const canAdd = isLast && newReferrers.length < remainingCount;

                  return (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={referrer}
                        placeholder="추가할 추천인 닉네임"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-primary"
                        onChange={(e) => handleChange(index, e.target.value)}
                      />

                      {canAdd ? (
                        <button
                          type="button"
                          onClick={handleAdd}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
                          aria-label="추천인 입력칸 추가"
                        >
                          <Plus size={20} />
                        </button>
                      ) : null}

                      {newReferrers.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemove(index)}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-50"
                          aria-label="추천인 입력칸 삭제"
                        >
                          <X size={18} />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
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
              disabled={saving || remainingCount <= 0}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:bg-slate-300"
            >
              {saving ? '저장 중...' : '추가하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
