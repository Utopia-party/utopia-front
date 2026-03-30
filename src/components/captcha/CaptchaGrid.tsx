/**
 * CaptchaGrid — 3×3 이미지 그리드 캡챠
 * CONTEXT.md Section 4:
 *   - 이모티콘 3개 (GAN 생성) 표시
 *   - 실제 동물 사진 9개 3×3 그리드
 *   - 이모티콘과 매칭되는 실제 사진을 순서대로 선택
 */
import { useEffect, useState } from 'react';
import type { CaptchaChallengeResponse } from './types';
import { ANIMAL_LABELS } from './captchaApi';

interface CaptchaGridProps {
  challenge: CaptchaChallengeResponse;
  onSubmit: (selectedIndices: number[]) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  errorMessage?: string;
  remainingAttempts?: number;
}

const CHALLENGE_SECONDS = 120;

function formatTime(totalSeconds: number) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function CaptchaGrid({
  challenge,
  onSubmit,
  onCancel,
  isSubmitting,
  errorMessage,
  remainingAttempts,
}: CaptchaGridProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(CHALLENGE_SECONDS);

  useEffect(() => {
    setSelectedIndices([]);
    setSecondsLeft(CHALLENGE_SECONDS);
  }, [challenge.session_id]);

  useEffect(() => {
    if (isSubmitting) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [challenge.session_id, isSubmitting]);

  const isExpired = secondsLeft === 0;

  const handlePhotoClick = (index: number) => {
    if (isSubmitting || isExpired) {
      return;
    }

    setSelectedIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((item) => item !== index);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, index];
    });
  };

  const handleSubmit = () => {
    if (selectedIndices.length !== 3 || isSubmitting || isExpired) {
      return;
    }
    onSubmit(selectedIndices);
  };

  const handleReset = () => {
    setSelectedIndices([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-[3px]">
      <div className="w-full max-w-[390px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_-38px_rgba(15,23,42,0.75)]">
        <div className="bg-[linear-gradient(180deg,#0f2748_0%,#193a67_100%)] px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-blue-100">
                SECURITY CHECK
              </div>
              <h2 className="mt-3 text-lg font-bold">봇 여부 확인 중입니다</h2>
              <p className="mt-1 text-xs leading-5 text-blue-100/90">
                위 이모티콘과 같은 동물을 왼쪽부터 순서대로 골라주세요.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full bg-white/8 p-2 text-white/75 transition hover:bg-white/14 hover:text-white"
              aria-label="캡챠 닫기"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M4 4L14 14M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-4 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
              1차 보안 인증
            </div>
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isExpired
                  ? 'bg-red-50 text-red-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isExpired ? '시간 만료' : `남은 시간 ${formatTime(secondsLeft)}`}
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">문제 카드</p>
              <p className="text-xs text-slate-400">선택 수 3개</p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {challenge.emojis.map((emoji, index) => (
                <div
                  key={emoji.id}
                  className="rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center shadow-[0_14px_30px_-24px_rgba(15,23,42,0.5)]"
                >
                  <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                    {index + 1}
                  </div>
                  <img
                    src={emoji.url}
                    alt={`이모티콘 ${index + 1}`}
                    className="mx-auto mt-2 h-14 w-14 rounded-2xl object-cover"
                    draggable={false}
                  />
                  <p className="mt-2 text-[11px] font-medium text-slate-500">
                    {ANIMAL_LABELS[emoji.category] ?? emoji.category}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-[0_20px_35px_-28px_rgba(15,23,42,0.6)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  실제 사진 선택
                </p>
                <p className="text-xs text-slate-400">
                  사진을 누르면 선택 순서가 표시됩니다.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                3 x 3
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {challenge.photos.map((photo) => {
                const selectionOrder = selectedIndices.indexOf(photo.index);
                const isSelected = selectionOrder !== -1;

                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => handlePhotoClick(photo.index)}
                    disabled={isSubmitting || isExpired}
                    className={`
                      group relative aspect-square overflow-hidden rounded-2xl border-[2px] transition-all duration-150
                      ${
                        isSelected
                          ? 'border-blue-500 ring-4 ring-blue-100'
                          : 'border-slate-200 hover:border-blue-300'
                      }
                      ${isSubmitting || isExpired ? 'cursor-default opacity-70' : 'cursor-pointer hover:-translate-y-0.5'}
                    `}
                  >
                    <img
                      src={photo.url}
                      alt={`사진 ${photo.index + 1}`}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                      draggable={false}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/45 to-transparent" />
                    <div className="absolute left-2 top-2 rounded-full bg-white/88 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {photo.index + 1}
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500/22">
                        <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg">
                          {selectionOrder + 1}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[0, 1, 2].map((slot) => (
              <div
                key={slot}
                className={`
                  flex h-9 flex-1 items-center justify-center rounded-2xl border text-sm font-semibold
                  ${
                    slot < selectedIndices.length
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-300'
                  }
                `}
              >
                {slot < selectedIndices.length
                  ? `${slot + 1}번 선택 완료`
                  : `${slot + 1}번 대기`}
              </div>
            ))}
          </div>

          {(errorMessage || isExpired) && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              <p className="font-semibold">
                {isExpired ? '인증 시간이 만료되었습니다.' : errorMessage}
              </p>
              {remainingAttempts !== undefined && !isExpired && (
                <p className="mt-1 text-xs text-red-500">
                  남은 시도 횟수 {remainingAttempts}회
                </p>
              )}
              {isExpired && (
                <p className="mt-1 text-xs text-red-500">
                  모달을 닫고 다시 시도해 주세요.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting || selectedIndices.length === 0}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                selectedIndices.length !== 3 || isSubmitting || isExpired
              }
              className={`
                flex-[1.3] rounded-2xl px-4 py-3 text-sm font-semibold text-white transition
                ${
                  selectedIndices.length === 3 && !isSubmitting && !isExpired
                    ? 'bg-[linear-gradient(135deg,#2563eb,#3b82f6)] shadow-[0_20px_36px_-22px_rgba(37,99,235,0.85)] hover:-translate-y-0.5'
                    : 'bg-slate-300'
                }
              `}
            >
              {isSubmitting ? '정답 확인 중...' : '선택 완료'}
            </button>
          </div>

          <p className="text-center text-[11px] leading-5 text-slate-400">
            선택 결과는 서버 검증 후 통과 처리되며, 정답과 순서 정보는
            클라이언트에 저장되지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
