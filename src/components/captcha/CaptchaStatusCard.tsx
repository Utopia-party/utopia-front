import { AlertTriangle, LockKeyhole, ShieldAlert } from 'lucide-react';
import type { CaptchaStatusResponse } from './types';

interface CaptchaStatusCardProps {
  status: Exclude<CaptchaStatusResponse['status'], 'NORMAL'>;
  message: string;
  retryAfterSeconds?: number;
  onRetryCheck: () => void;
}

function formatTime(totalSeconds?: number) {
  if (!totalSeconds || totalSeconds <= 0) {
    return '00:00';
  }

  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function CaptchaStatusCard({
  status,
  message,
  retryAfterSeconds,
  onRetryCheck,
}: CaptchaStatusCardProps) {
  // ── 이번 수정: WAIT / LOCKED / BANNED 시안 카드 실제 로그인 흐름 연결 ──
  // retry_after_seconds가 0 이하가 되면 버튼을 활성화해서 사용자가 상태 재확인을 요청할 수 있게 합니다.
  const isTimerFinished = !retryAfterSeconds || retryAfterSeconds <= 0;

  if (status === 'WAIT') {
    // WAIT 카드는 "짧은 시간 내 과도한 요청"처럼 아직 잠금까지는 아닌 완충 상태를 표현합니다.
    const waitProgress = Math.min(
      100,
      Math.max(0, ((30 - Math.min(retryAfterSeconds ?? 0, 30)) / 30) * 100),
    );

    return (
      <div className="w-full max-w-[360px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_-26px_rgba(15,23,42,0.55)]">
        <div className="bg-[linear-gradient(180deg,#132845_0%,#1b3a64_100%)] px-5 py-4 text-white">
          <p className="text-base font-bold">곧 재시도할 수 있습니다</p>
          <p className="mt-1 text-xs leading-5 text-blue-100/90">
            비정상 패턴이 감지되어 잠시 대기 중입니다.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
              보호 상태 안내
            </div>
            <div className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-600">
              WAIT
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
            <p className="text-xs font-medium text-amber-700">
              재시도 가능 시간
            </p>
            <p className="mt-2 text-3xl font-bold tracking-[0.2em] text-orange-500">
              {formatTime(retryAfterSeconds)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              잠금 사유: 짧은 시간 내 반복 요청
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {message}
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#f97316)] transition-all duration-1000"
                style={{ width: `${waitProgress}%` }}
              />
            </div>
            <button
              type="button"
              onClick={onRetryCheck}
              disabled={!isTimerFinished}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isTimerFinished ? '다시 확인' : '대기 후 다시 시도'}
            </button>
          </div>

          <p className="text-center text-[11px] leading-5 text-slate-400">
            일정 시간이 지나면 다시 캡챠 인증을 시도할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'LOCKED') {
    // LOCKED 카드는 이미지 캡챠 5회 실패 후 짧은 잠금이 걸린 상태를 보여줍니다.
    return (
      <div className="w-full max-w-[360px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_-26px_rgba(15,23,42,0.55)]">
        <div className="bg-[linear-gradient(180deg,#132845_0%,#1b3a64_100%)] px-5 py-4 text-white">
          <p className="text-base font-bold">보안 잠금이 작동되었습니다</p>
          <p className="mt-1 text-xs leading-5 text-blue-100/90">
            반복 실패로 인해 잠시 동안 잠금 상태가 유지됩니다.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
              남은 실패 기록
            </div>
            <div className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">
              LOCKED
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-400"
              >
                X
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
            <p className="text-xs font-medium text-slate-500">
              재시도 가능 시간
            </p>
            <p className="mt-2 text-3xl font-bold tracking-[0.2em] text-red-500">
              {formatTime(retryAfterSeconds)}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            <div className="flex items-start gap-2">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-6">{message}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRetryCheck}
            disabled={!isTimerFinished}
            className="w-full rounded-2xl bg-slate-300 px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed"
          >
            {isTimerFinished ? '다시 확인' : '재시도 대기 중'}
          </button>

          <p className="text-center text-[11px] leading-5 text-slate-400">
            잠금 해제 후 새로운 캡챠와 남은 기회가 다시 주어집니다.
          </p>
        </div>
      </div>
    );
  }

  // BANNED는 잠금 사이클이 누적되어 더 이상 캡챠 재시도를 허용하지 않는 최종 상태입니다.
  return (
    <div className="w-full max-w-[360px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_-26px_rgba(15,23,42,0.55)]">
      <div className="bg-[linear-gradient(180deg,#132845_0%,#1b3a64_100%)] px-5 py-4 text-white">
        <p className="text-base font-bold">접근이 차단되었습니다</p>
        <p className="mt-1 text-xs leading-5 text-blue-100/90">
          반복 실패 또는 악성 패턴이 감지된 경우입니다.
        </p>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
            보안 경보 상태
          </div>
          <div className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">
            BANNED
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-600">
                현재 세션은 차단 상태입니다.
              </p>
              <p className="mt-2 text-xs leading-5 text-red-500">{message}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p className="leading-6">
              문제가 지속되면 관리자 문의를 통해 해제 요청이 가능합니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            홈으로 이동
          </button>
          <a
            href="mailto:contact@partyup.com"
            className="flex items-center justify-center rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white"
          >
            문의하기
          </a>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          contact@partyup.com | 02-1234-5670
        </p>
      </div>
    </div>
  );
}
