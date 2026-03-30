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
    <button
      type="button"
      className={`
        flex w-full max-w-[360px] items-center gap-4 rounded-2xl border px-4 py-4 text-left
        shadow-[0_18px_40px_-26px_rgba(15,23,42,0.55)] transition-all duration-200
        ${
          isBlocked
            ? 'border-red-200 bg-red-50/95'
            : isChecked
              ? 'border-emerald-200 bg-emerald-50/90'
              : 'border-slate-200 bg-white/95'
        }
        ${isClickable ? 'cursor-pointer hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_22px_50px_-28px_rgba(37,99,235,0.45)]' : 'cursor-default'}
      `}
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
    >
      <div
        className={`
          flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-all
          ${
            isChecked
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : isLoading
                ? 'border-blue-400 bg-blue-50'
                : isBlocked
                  ? 'border-red-400 bg-red-100 text-red-500'
                  : 'border-slate-300 bg-white'
          }
        `}
      >
        {isChecked && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7L5.4 10.4L12 3.8"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {isLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        )}
        {isBlocked && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 3L11 11M11 3L3 11"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold ${
            isBlocked
              ? 'text-red-700'
              : isChecked
                ? 'text-emerald-700'
                : 'text-slate-800'
          }`}
        >
          {isBlocked
            ? '비정상적인 접근이 감지되었습니다'
            : isChecked
              ? '인증이 완료되었습니다'
              : isLoading
                ? '행동 패턴을 확인하고 있습니다'
                : phase === 'failed'
                  ? '다시 한 번 확인해 주세요'
                  : '로봇이 아닙니다'}
        </p>
        <p
          className={`mt-1 text-xs ${
            isBlocked
              ? 'text-red-500'
              : isChecked
                ? 'text-emerald-500'
                : 'text-slate-500'
          }`}
        >
          {isBlocked
            ? '보안 정책에 따라 이용이 잠시 제한됩니다.'
            : isChecked
              ? '원래 작업을 계속 진행할 수 있어요.'
              : isLoading
                ? '잠시만 기다리면 자동으로 다음 단계가 열립니다.'
                : '클릭 후 사람인지 빠르게 검증합니다.'}
        </p>
      </div>

      <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1d4ed8,#60a5fa)] text-xs font-bold text-white">
          P
        </div>
        <p className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-slate-400">
          PARTY
        </p>
      </div>
    </button>
  );
}
