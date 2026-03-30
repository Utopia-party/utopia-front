import { useState, type ReactNode } from 'react';
import {
  ArrowRight,
  CircleAlert,
  Clock3,
  LockKeyhole,
  MessageSquareWarning,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { CaptchaWidget } from '../components/captcha';

type PreviewMode = 'wait' | 'locked' | 'banned';

const previewTabs: Array<{
  mode: PreviewMode;
  label: string;
  summary: string;
}> = [
  {
    mode: 'wait',
    label: '재시도 대기',
    summary: '짧은 대기 후 다시 문제를 불러오는 상태',
  },
  {
    mode: 'locked',
    label: '보안 잠금',
    summary: '실패 횟수 초과로 잠금이 걸린 상태',
  },
  {
    mode: 'banned',
    label: '접근 차단',
    summary: '하드 밴 또는 문의 유도 상태',
  },
];

function PreviewPhone({
  accent,
  children,
}: {
  accent: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#e8f0fb_0%,#edf3fb_100%)] p-5 shadow-[0_28px_80px_-45px_rgba(15,23,42,0.55)]">
      <div
        className={`mx-auto w-full max-w-[300px] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_28px_60px_-36px_rgba(15,23,42,0.45)] ${accent}`}
      >
        {children}
      </div>
    </div>
  );
}

function WaitPreview() {
  return (
    <PreviewPhone accent="">
      <div className="bg-[linear-gradient(180deg,#132845_0%,#1b3a64_100%)] px-5 py-4 text-white">
        <p className="text-lg font-bold">곧 재시도할 수 있습니다</p>
        <p className="mt-1 text-xs text-blue-100/90">
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
          <p className="text-xs font-medium text-amber-700">재시도 가능 시간</p>
          <p className="mt-2 text-3xl font-bold tracking-[0.2em] text-orange-500">
            00:27
          </p>
        </div>

        <div className="space-y-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            잠금 사유: 짧은 시간 내 반복 요청
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            재시도 후에는 새 문제가 출제됩니다.
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,#f59e0b,#f97316)]" />
          </div>
          <button
            type="button"
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            대기 후 다시 시도
          </button>
        </div>

        <p className="text-center text-[11px] leading-5 text-slate-400">
          일정 시간이 지나면 자동으로 인증을 다시 시작합니다.
        </p>
      </div>
    </PreviewPhone>
  );
}

function LockedPreview() {
  return (
    <PreviewPhone accent="">
      <div className="bg-[linear-gradient(180deg,#132845_0%,#1b3a64_100%)] px-5 py-4 text-white">
        <p className="text-lg font-bold">보안 잠금이 작동되었습니다</p>
        <p className="mt-1 text-xs text-blue-100/90">
          반복 실패로 인해 60초 동안 잠금 상태가 유지됩니다.
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
          <p className="text-xs font-medium text-slate-500">재시도 가능 시간</p>
          <p className="mt-2 text-3xl font-bold tracking-[0.2em] text-red-500">
            00:60
          </p>
        </div>

        <button
          type="button"
          className="w-full rounded-2xl bg-slate-300 px-4 py-3 text-sm font-semibold text-white"
        >
          재시도 대기 중
        </button>

        <p className="text-center text-[11px] leading-5 text-slate-400">
          잠금 해제 후 새로운 캡챠와 남은 기회가 다시 주어집니다.
        </p>
      </div>
    </PreviewPhone>
  );
}

function BannedPreview() {
  return (
    <PreviewPhone accent="">
      <div className="bg-[linear-gradient(180deg,#132845_0%,#1b3a64_100%)] px-5 py-4 text-white">
        <p className="text-lg font-bold">접근이 차단되었습니다</p>
        <p className="mt-1 text-xs text-blue-100/90">
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
          <p className="text-sm font-semibold text-red-600">
            현재 세션은 차단 상태입니다.
          </p>
          <p className="mt-2 text-xs leading-5 text-red-500">
            IP / 브라우저 시그니처가 보안 정책에 저촉되었거나, 반복 실패가
            누적되었습니다.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
          <p>- 차단 사유는 해시된 정보로만 저장됩니다.</p>
          <p className="mt-2">
            - 문제가 지속되면 관리자 문의를 통해 해제 요청이 가능합니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            홈으로 이동
          </button>
          <button
            type="button"
            className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white"
          >
            문의하기
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          contact@partyup.com | 02-1234-5670
        </p>
      </div>
    </PreviewPhone>
  );
}

function StatusPreview({ mode }: { mode: PreviewMode }) {
  if (mode === 'locked') {
    return <LockedPreview />;
  }
  if (mode === 'banned') {
    return <BannedPreview />;
  }
  return <WaitPreview />;
}

export default function CaptchaDemo() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('wait');

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.55),_transparent_38%),linear-gradient(180deg,#f7fbff_0%,#eef4fb_48%,#f8fafc_100%)] px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[36px] border border-white/70 bg-white/80 p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.65)] backdrop-blur xl:p-8">
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                CAPTCHA UI PREVIEW
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                스크린샷 기준으로 재구성한 캡챠 프론트 화면
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                로그인 폼 안에 들어가는 체크박스, 전체화면 이미지 캡챠 모달,
                재시도 대기, 보안 잠금, 접근 차단 상태를 한 페이지에서 볼 수
                있게 정리했습니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-slate-400">
                  PHASE 1
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  행동 분석 + 이미지 선택
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-slate-400">
                  STATE
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  WAIT / LOCK / BAN
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-slate-400">
                  USE
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  로그인/회원가입 공통
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
            <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_26px_70px_-48px_rgba(15,23,42,0.55)]">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    실제 사용 화면
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900">
                    로그인 폼 안에서 바로 열리는 보안 확인
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    체크박스는 인라인으로 두고, 이미지 캡챠는 스크린샷처럼
                    전체화면 모달로 띄우도록 구성했습니다.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  체크박스를 눌러 challenge 상태가 되면
                  <span className="mx-1 font-semibold text-slate-800">
                    오버레이 모달
                  </span>
                  이 열립니다.
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_55px_-42px_rgba(15,23,42,0.45)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#60a5fa)] text-sm font-bold text-white">
                      P
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-slate-400">
                        PARTY-UP
                      </p>
                      <p className="text-lg font-bold text-slate-900">로그인</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-600">
                        이메일
                      </span>
                      <input
                        type="email"
                        placeholder="name@partyup.com"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-600">
                        비밀번호
                      </span>
                      <input
                        type="password"
                        placeholder="8자 이상 입력"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                      />
                    </label>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex justify-center">
                        <CaptchaWidget
                          onSuccess={(value) => {
                            setToken(value);
                            setError(null);
                          }}
                          onError={(message) => {
                            setError(message);
                            setToken(null);
                          }}
                        />
                      </div>
                    </div>

                    {token && (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <p className="text-xs font-semibold tracking-[0.12em] text-emerald-700">
                          CAPTCHA TOKEN
                        </p>
                        <p className="mt-2 break-all text-xs leading-5 text-emerald-600">
                          {token}
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <button
                      type="button"
                      className={`
                        flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition
                        ${
                          token
                            ? 'bg-[linear-gradient(135deg,#2563eb,#3b82f6)] shadow-[0_20px_36px_-22px_rgba(37,99,235,0.8)]'
                            : 'bg-slate-300'
                        }
                      `}
                    >
                      로그인 계속하기
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold tracking-[0.16em] text-slate-400">
                      SCREEN NOTES
                    </p>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-500">
                      <li className="flex gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        체크박스는 로그인/회원가입 폼 안에 작게 유지합니다.
                      </li>
                      <li className="flex gap-3">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        이미지 선택 단계는 모달로 분리해 집중도를 높였습니다.
                      </li>
                      <li className="flex gap-3">
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        실패 상태는 WAIT, LOCKED, BANNED로 명확히 나눕니다.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold tracking-[0.16em] text-slate-400">
                      USER FLOW
                    </p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        1. 체크박스 클릭 후 행동분석
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        2. challenge 시 이미지 모달 노출
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        3. 반복 실패 시 WAIT / LOCK / BAN 순서로 전환
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#132845_100%)] p-6 text-white shadow-[0_28px_70px_-44px_rgba(15,23,42,0.75)]">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-blue-100">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    상태 화면 프리뷰
                  </div>
                  <h2 className="mt-3 text-2xl font-bold">
                    보안 정책 응답 화면
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-blue-100/75">
                    스크린샷에 있던 WAIT, LOCKED, BANNED 상태를 모바일 카드
                    형태로 정리했습니다.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-blue-100/80">
                  오른쪽 카드는 프론트 전용 시안이라 API 없이도 확인할 수
                  있습니다.
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {previewTabs.map((tab) => (
                  <button
                    key={tab.mode}
                    type="button"
                    onClick={() => setPreviewMode(tab.mode)}
                    className={`
                      rounded-full px-4 py-2 text-sm font-semibold transition
                      ${
                        previewMode === tab.mode
                          ? 'bg-white text-slate-900'
                          : 'bg-white/8 text-blue-100/80 hover:bg-white/14'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-blue-100/75">
                {previewTabs.find((tab) => tab.mode === previewMode)?.summary}
              </div>

              <div className="mt-6">
                <StatusPreview mode={previewMode} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
                  <Clock3 className="h-5 w-5 text-amber-300" />
                  <p className="mt-3 text-sm font-semibold">WAIT</p>
                  <p className="mt-2 text-xs leading-5 text-blue-100/65">
                    일정 시간 후 문제를 새로 불러오게 유도합니다.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
                  <LockKeyhole className="h-5 w-5 text-red-300" />
                  <p className="mt-3 text-sm font-semibold">LOCKED</p>
                  <p className="mt-2 text-xs leading-5 text-blue-100/65">
                    실패 횟수 초과 시 일정 시간 인증을 잠급니다.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
                  <MessageSquareWarning className="h-5 w-5 text-blue-200" />
                  <p className="mt-3 text-sm font-semibold">BANNED</p>
                  <p className="mt-2 text-xs leading-5 text-blue-100/65">
                    문의 버튼과 안내 문구로 후속 조치를 제공합니다.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-500 lg:grid-cols-3">
            <div className="flex gap-3">
              <RefreshCw className="mt-1 h-4 w-4 shrink-0 text-blue-500" />
              <p>
                이미지 캡챠는 전체화면 오버레이로 띄워 스크린샷의 몰입감을
                그대로 살렸습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <Clock3 className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
              <p>
                재시도 대기와 잠금 시간은 시각적으로 강하게 보여주도록 대형
                타이머 카드로 구성했습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <ShieldAlert className="mt-1 h-4 w-4 shrink-0 text-red-500" />
              <p>
                차단 화면은 홈 이동과 문의 CTA를 분리해 운영 대응 시나리오까지
                고려했습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
