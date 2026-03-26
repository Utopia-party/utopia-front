/**
 * CaptchaCheckbox — "로봇이 아닙니다" 체크박스
 * CONTEXT.md Section 14: 하이브리드 v2+v3 캡챠
 * 체크박스 클릭 → 행동 데이터 수집 → POST /api/captcha/init
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
  const isBlocked = phase === 'blocked';

  return (
    <div
      className={`
        flex items-center gap-3 px-5 py-3.5 rounded-lg border-2 w-full max-w-[320px]
        select-none transition-all duration-200
        ${
          isBlocked
            ? 'border-red-300 bg-red-50'
            : isChecked
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 bg-white hover:border-blue-300'
        }
        ${isClickable ? 'cursor-pointer' : 'cursor-default'}
      `}
      onClick={isClickable ? onClick : undefined}
    >
      {/* 체크박스 영역 */}
      <div
        className={`
          w-6 h-6 rounded border-2 flex items-center justify-center
          transition-all duration-200 shrink-0
          ${
            isChecked
              ? 'bg-green-500 border-green-500'
              : isLoading
                ? 'border-blue-400 bg-blue-50'
                : isBlocked
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
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        )}
        {isBlocked && (
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

      {/* 텍스트 */}
      <div className="flex-1">
        <span
          className={`text-sm font-medium ${isBlocked ? 'text-red-600' : 'text-gray-700'}`}
        >
          {isBlocked
            ? '비정상적인 접근이 감지되었습니다'
            : isChecked
              ? '인증 완료'
              : isLoading
                ? '확인 중...'
                : phase === 'failed'
                  ? '다시 시도해주세요'
                  : '로봇이 아닙니다'}
        </span>
      </div>

      {/* 로고 영역 */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">P</span>
        </div>
        <span className="text-[9px] text-gray-400 mt-0.5">Party-Up</span>
      </div>
    </div>
  );
}
