/**
 * CaptchaCheckbox — "로봇이 아닙니다" 체크박스
 */
import type { CaptchaPhase } from './types';

interface CaptchaCheckboxProps {
  phase: CaptchaPhase;
  onClick: () => void;
}

export default function CaptchaCheckbox({
  phase,
  onClick,
}: CaptchaCheckboxProps) {
  const isClickable = phase === 'idle' || phase === 'failed';
  const isChecked = phase === 'passed' || phase === 'success';
  const isLoading = phase === 'verifying' || phase === 'submitting';
  const isWarning =
    phase === 'wait' || phase === 'locked' || phase === 'banned';

  const label =
    phase === 'wait'
      ? '잠시 후 다시 시도해주세요'
      : phase === 'locked'
        ? '보안 정책에 따라 잠시 잠금되었습니다'
        : phase === 'banned'
          ? '반복 실패로 접근이 차단되었습니다'
          : phase === 'failed'
            ? '다시 시도해주세요'
            : phase === 'passed' || phase === 'success'
              ? '인증 완료'
              : phase === 'verifying'
                ? '확인 중...'
                : '로봇이 아닙니다';

  return (
    <div
      className={`
        flex w-full max-w-[320px] select-none items-center gap-3 rounded-lg border-2 px-5 py-3.5
        transition-all duration-200
        ${
          isWarning
            ? 'border-red-300 bg-red-50'
            : isChecked
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 bg-white hover:border-blue-300'
        }
        ${isClickable ? 'cursor-pointer' : 'cursor-default'}
      `}
      onClick={isClickable ? onClick : undefined}
    >
      <div
        className={`
          flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-all duration-200
          ${
            isChecked
              ? 'border-green-500 bg-green-500'
              : isLoading
                ? 'border-blue-400 bg-blue-50'
                : isWarning
                  ? 'border-red-400 bg-red-100'
                  : 'border-gray-300 bg-white'
          }
        `}
      >
        {isChecked && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7L5.5 10.5L12 3.5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {isLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        )}

        {isWarning && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 3L11 11M11 3L3 11"
              stroke="#EF4444"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      <div className="flex-1">
        <span
          className={`text-sm font-medium ${
            isWarning ? 'text-red-600' : 'text-gray-700'
          }`}
        >
          {label}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-center">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500">
          <span className="text-xs font-bold text-white">P</span>
        </div>
        <span className="mt-0.5 text-[9px] text-gray-400">Party-Up</span>
      </div>
    </div>
  );
}
