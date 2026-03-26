/**
 * CaptchaGrid — 3×3 이미지 그리드 캡챠
 * CONTEXT.md Section 4:
 *   - 이모티콘 3개 (GAN 생성) 표시
 *   - 실제 동물 사진 9개 3×3 그리드
 *   - 이모티콘과 매칭되는 실제 사진을 순서대로 선택
 */
import { useState, useCallback } from 'react';
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
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handlePhotoClick = useCallback(
    (index: number) => {
      if (isSubmitting) return;

      setSelectedIndices((prev) => {
        // 이미 선택된 경우 해제
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index);
        }
        // 3개까지만 선택 가능
        if (prev.length >= 3) return prev;
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
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full max-w-[400px]">
      {/* ── 헤더 ─────────────────────────── */}
      <div className="bg-blue-500 px-4 py-3 flex items-center justify-between">
        <span className="text-white text-sm font-semibold">
          아래 이모티콘과 같은 동물을 순서대로 선택하세요
        </span>
        <button
          onClick={onCancel}
          className="text-white/70 hover:text-white transition cursor-pointer"
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

      {/* ── 이모티콘 3개 표시 (순서 중요!) ─── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-center gap-4">
          {challenge.emojis.map((emoji, idx) => (
            <div key={emoji.id} className="flex flex-col items-center">
              <div className="relative">
                <span className="absolute -top-2 -left-2 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <img
                  src={emoji.url}
                  alt={`이모티콘 ${idx + 1}`}
                  className="w-16 h-16 rounded-lg border-2 border-blue-200 object-cover"
                  draggable={false}
                />
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {ANIMAL_LABELS[emoji.category] ?? emoji.category}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">아래 사진에서 찾기</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      </div>

      {/* ── 3×3 사진 그리드 ──────────────── */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2">
          {challenge.photos.map((photo) => {
            const selectionOrder = selectedIndices.indexOf(photo.index);
            const isSelected = selectionOrder !== -1;

            return (
              <button
                key={photo.id}
                onClick={() => handlePhotoClick(photo.index)}
                disabled={isSubmitting}
                className={`
                  relative aspect-square rounded-lg overflow-hidden border-3 transition-all duration-150
                  cursor-pointer
                  ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200 scale-95'
                      : 'border-transparent hover:border-blue-300 hover:scale-[1.02]'
                  }
                  ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}
                `}
              >
                <img
                  src={photo.url}
                  alt={`사진 ${photo.index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <span className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                      {selectionOrder + 1}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 에러 메시지 ──────────────────── */}
      {errorMessage && (
        <div className="px-4 pb-2">
          <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
            {errorMessage}
            {remainingAttempts !== undefined && (
              <span className="ml-1 text-red-400">
                (남은 시도: {remainingAttempts}회)
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── 선택 현황 + 버튼 ─────────────── */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all
                ${
                  i < selectedIndices.length
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-300 text-gray-300'
                }
              `}
            >
              {i + 1}
            </div>
          ))}
          <span className="text-xs text-gray-400 ml-1">
            {selectedIndices.length}/3
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={isSubmitting || selectedIndices.length === 0}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition disabled:opacity-40 cursor-pointer"
          >
            초기화
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedIndices.length !== 3 || isSubmitting}
            className={`
              px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer
              ${
                selectedIndices.length === 3 && !isSubmitting
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                확인 중
              </span>
            ) : (
              '확인'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
