import { useEffect, useState } from 'react';
import type { CaptchaStatusResponse } from './types';

type SecurityStatus = Extract<
  CaptchaStatusResponse['status'],
  'WAIT' | 'LOCKED' | 'BANNED'
>;

interface CaptchaStatusCardProps {
  status: SecurityStatus;
  message: string;
  retryAfterSeconds?: number | null;
  onRetry: () => void;
  isRetrying?: boolean;
}

function formatSeconds(seconds: number) {
  if (seconds <= 0) return '0초';
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}분 ${remainSeconds}초`;
  }

  return `${remainSeconds}초`;
}

export default function CaptchaStatusCard({
  status,
  message,
  retryAfterSeconds,
  onRetry,
  isRetrying = false,
}: CaptchaStatusCardProps) {
  const [secondsLeft, setSecondsLeft] = useState(retryAfterSeconds ?? 0);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const title =
    status === 'WAIT'
      ? '잠시 후 다시 시도해 주세요.'
      : status === 'LOCKED'
        ? '비정상적인 접근이 감지되었습니다.'
        : '반복 실패로 접근이 차단되었습니다.';

  const description =
    status === 'WAIT'
      ? '요청이 많아 잠시 대기 상태입니다.'
      : status === 'LOCKED'
        ? '보안 정책에 따라 이용이 잠시 제한됩니다.'
        : '관리자 정책에 따라 더 이상 진행할 수 없습니다.';

  const canRetry = status !== 'BANNED' && secondsLeft <= 0 && !isRetrying;

  return (
    <div className="w-full max-w-[320px] rounded-2xl border border-red-200 bg-red-50/80 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-red-400 bg-white text-red-500">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 3L11 11M11 3L3 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-red-600">{title}</p>
          <p className="mt-1 text-xs text-red-500">{message || description}</p>
          {(status === 'WAIT' || status === 'LOCKED') && (
            <p className="mt-1 text-xs font-medium text-red-500">
              남은 시간: {formatSeconds(secondsLeft)}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
            P
          </div>
          <span className="mt-1 text-[10px] text-slate-400">PARTY</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        disabled={!canRetry}
        className="mt-3 w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'BANNED'
          ? '차단됨'
          : isRetrying
            ? '확인 중...'
            : secondsLeft > 0
              ? `재시도까지 ${formatSeconds(secondsLeft)}`
              : '재시도'}
      </button>
    </div>
  );
}
