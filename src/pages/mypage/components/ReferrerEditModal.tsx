import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { updateMyReferrers } from '../../../apis/user';

const MAX_REFERRERS = 5;

type ReferrerEditModalProps = {
  open: boolean;
  onClose: () => void;
  initialReferrers: string[];
  onSaved: () => void;
};

function getReferrerDisplayName(referrer: string) {
  const value = referrer.trim();

  if (!value || value.startsWith('deleted_')) {
    return '탈퇴한 사용자';
  }

  return value;
}

export default function ReferrerEditModal({
  open,
  onClose,
  initialReferrers,
  onSaved,
}: ReferrerEditModalProps) {
  const [newReferrer, setNewReferrer] = useState('');
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
  const isFull = remainingCount <= 0;

  useEffect(() => {
    if (!open) return;

    setNewReferrer('');
    setError('');
    setSaving(false);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedReferrer = newReferrer.trim();

    if (isFull) {
      setError(`추천인은 최대 ${MAX_REFERRERS}명까지 등록할 수 있습니다.`);
      return;
    }

    if (!trimmedReferrer) {
      setError('추가할 추천인을 입력해주세요.');
      return;
    }

    if (trimmedReferrer.startsWith('deleted_')) {
      setError('탈퇴한 사용자는 추천인으로 추가할 수 없습니다.');
      return;
    }

    if (lockedReferrers.includes(trimmedReferrer)) {
      setError('이미 등록된 추천인입니다.');
      return;
    }

    const nextReferrers = [...lockedReferrers, trimmedReferrer];

    try {
      setSaving(true);
      setError('');

      await updateMyReferrers({
        referrers: nextReferrers,
      });

      alert('추천인이 추가되었습니다.');
      setNewReferrer('');
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
              기존 추천인은 최신순으로 조회만 가능하며, 추천인은 한 번에 한 명만
              추가할 수 있습니다.
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
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {lockedReferrers.map((referrer, index) => {
                  const displayName = getReferrerDisplayName(referrer);
                  const isDeletedUser = displayName === '탈퇴한 사용자';

                  return (
                    <div
                      key={`${referrer}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <span
                          className={`text-sm font-bold ${
                            isDeletedUser ? 'text-slate-400' : 'text-slate-700'
                          }`}
                        >
                          {displayName}
                        </span>

                        {index === 0 ? (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-[11px] font-bold text-primary">
                            최신
                          </span>
                        ) : null}

                        {isDeletedUser ? (
                          <span className="ml-2 rounded-full bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-500">
                            탈퇴
                          </span>
                        ) : null}
                      </div>

                      <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-500">
                        수정 불가
                      </span>
                    </div>
                  );
                })}
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

            {isFull ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm font-semibold text-primary">
                이미 추천인을 최대 {MAX_REFERRERS}명까지 등록했습니다.
              </div>
            ) : (
              <input
                type="text"
                value={newReferrer}
                placeholder="추가할 추천인 닉네임"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-primary"
                onChange={(e) => {
                  setNewReferrer(e.target.value);
                  setError('');
                }}
              />
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
              닫기
            </button>

            {!isFull ? (
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:bg-slate-300"
              >
                {saving ? '저장 중...' : '추가하기'}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
