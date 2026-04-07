/**
 * CaptchaGrid — 3×3 이미지 그리드 캡챠
 * 모달 오버레이 안에서 동작합니다.
 */
import { useState, useCallback, useEffect } from 'react'; // 상원
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

export default function CaptchaGrid({
  challenge,
  onSubmit,
  onCancel,
  isSubmitting,
  errorMessage,
  remainingAttempts,
}: CaptchaGridProps) {
  // 상원: 사용자가 현재 문제에서 누른 사진 칸 번호들을 순서대로 저장합니다.
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  // 상원: 새 문제를 받았는지 안전하게 감지하려고 사진 id 목록을 하나의 문자열로 묶습니다.
  const photoSignature = challenge.photos.map((photo) => photo.id).join('|'); // 상원

  // 상원: 이전 문제에서 누른 1, 2, 3 선택 순서가 새 문제에 남지 않도록 문제 교체 시 초기화합니다.
  useEffect(() => {
    // 상원
    // 상원: 문제 세션이나 사진 구성이 바뀌면 선택 배열을 빈 배열로 되돌립니다.
    setSelectedIndices([]); // 상원
  }, [challenge.session_id, photoSignature]); // 상원

  const handlePhotoClick = useCallback(
    (index: number) => {
      if (isSubmitting) return;

      setSelectedIndices((prev) => {
        if (prev.includes(index)) {
          return prev.filter((item) => item !== index);
        }

        if (prev.length >= 3) {
          return prev;
        }

        return [...prev, index];
      });
    },
    [isSubmitting],
  );

  const handleSubmit = () => {
    if (selectedIndices.length !== 3 || isSubmitting) return;
    onSubmit(selectedIndices);
  };

  const handleReset = () => {
    setSelectedIndices([]);
  };

  return (
    <>
      {/* 상원: 1차 캡챠 challenge는 로그인/회원가입 흐름을 끊지 않도록 모달로 표시합니다. */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
        onClick={onCancel}
      >
        <div
          className="w-full max-w-[430px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.22)]"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="이미지 캡챠"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
            <div>
              <p className="text-base font-bold text-slate-900">
                순서대로 같은 동물을 선택하세요
              </p>
              <p className="mt-1 text-xs text-slate-500">
                이모티콘 3개와 같은 동물을 아래 사진에서 순서대로 골라주세요.
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
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

          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-center gap-4">
              {challenge.emojis.map((emoji, idx) => (
                <div key={emoji.id} className="flex flex-col items-center">
                  <div className="relative">
                    <span className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <img
                      src={emoji.url}
                      alt={`이모티콘 ${idx + 1}`}
                      className="h-16 w-16 rounded-xl border-2 border-blue-200 object-cover"
                      draggable={false}
                    />
                  </div>
                  <span className="mt-1 text-xs text-slate-500">
                    {ANIMAL_LABELS[emoji.category] ?? emoji.category}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">아래 사진에서 찾기</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {challenge.photos.map((photo) => {
                const selectionOrder = selectedIndices.indexOf(photo.index);
                const isSelected = selectionOrder !== -1;

                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => handlePhotoClick(photo.index)}
                    disabled={isSubmitting}
                    className={`
                    relative aspect-square overflow-hidden rounded-xl border-[3px] transition-all duration-150
                    ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-transparent hover:border-blue-300'
                    }
                    ${isSubmitting ? 'pointer-events-none opacity-60' : ''}
                  `}
                  >
                    <img
                      src={photo.url}
                      alt={`사진 ${photo.index + 1}`}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white shadow-md">
                          {selectionOrder + 1}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div className="px-5 pb-3">
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">
                {errorMessage}
                {remainingAttempts !== undefined && (
                  <span className="ml-1 text-red-400">
                    (남은 시도: {remainingAttempts}회)
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-4">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`
                  flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-all
                  ${
                    index < selectedIndices.length
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-slate-300 text-slate-300'
                  }
                `}
                >
                  {index + 1}
                </div>
              ))}
              <span className="ml-1 text-xs text-slate-400">
                {selectedIndices.length}/3
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting || selectedIndices.length === 0}
                className="px-3 py-1.5 text-sm text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={selectedIndices.length !== 3 || isSubmitting}
                className={`
                rounded-lg px-4 py-1.5 text-sm font-medium transition-all
                ${
                  selectedIndices.length === 3 && !isSubmitting
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'cursor-not-allowed bg-slate-200 text-slate-400'
                }
              `}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    확인 중
                  </span>
                ) : (
                  '확인'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* 상원: 모달 닫기까지 포함해 현재 challenge 세션 화면만 담당합니다. */}
    </>
  );
}
