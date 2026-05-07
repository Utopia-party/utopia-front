import { useNavigate } from 'react-router';
import type { Party } from '../../../types/party';
import ServiceLogo from './ServiceLogo';
import { STATUS_LABEL } from '../../../constants/party';
import { CATEGORY_COLOR } from '../../chat/ChatConstants';

export default function PartyCard({
  party,
  onDetail,
  onApply,
}: {
  party: Party & {
    is_joined?: boolean;
    my_member_status?: string | null;
  };
  onDetail: (p: Party) => void;
  onApply: (p: Party) => void;
}) {
  const navigate = useNavigate();

  const isClosed = party.status !== 'recruiting';
  const isJoined = party.is_joined;
  const myStatus: string | null = party.my_member_status ?? null;
  const categoryName = party.category_name || '기타';

  const maxMembers = party.max_members ?? 0;
  const memberCount = party.member_count ?? 0;
  const pendingCount = party.pending_count ?? 0;
  const spotsLeft = Math.max(maxMembers - memberCount, 0);

  const monthlyPrice = party.monthly_price ?? 0;
  const originalPrice = party.original_price ?? 0;

  const savingPct =
    originalPrice > 0 && originalPrice > monthlyPrice
      ? Math.round((1 - monthlyPrice / originalPrice) * 100)
      : null;

  const activePct =
    maxMembers > 0 ? Math.min(100, (memberCount / maxMembers) * 100) : 0;

  const pendingPct =
    maxMembers > 0
      ? Math.min(100 - activePct, (pendingCount / maxMembers) * 100)
      : 0;

  const statusLabel = STATUS_LABEL[party.status ?? ''] || '모집중';

  const renderActionButton = () => {
    if (isJoined) {
      return (
        <button
          type="button"
          onClick={() => navigate(`/party/${party.id}/chat`)}
          className="min-h-11.5 flex-1 rounded-2xl bg-indigo-600 px-3 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95"
        >
          채팅방 입장
        </button>
      );
    }

    if (myStatus === 'pending') {
      return (
        <button
          type="button"
          disabled
          className="min-h-11.5 flex-1 cursor-not-allowed rounded-2xl bg-amber-100 px-3 py-3 text-sm font-bold text-amber-700"
        >
          승인 대기중
        </button>
      );
    }

    if (myStatus === 'kicked') {
      return (
        <button
          type="button"
          disabled
          className="min-h-11.5 flex-1 cursor-not-allowed rounded-2xl bg-rose-100 px-3 py-3 text-sm font-bold text-rose-700"
        >
          참여 불가
        </button>
      );
    }

    return (
      <button
        type="button"
        disabled={isClosed}
        onClick={() => onApply(party)}
        className={`min-h-11.5 flex-1 rounded-2xl px-3 py-3 text-sm font-bold transition active:scale-95 ${
          isClosed
            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
            : 'bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:shadow-lg'
        }`}
      >
        {isClosed
          ? statusLabel || '마감'
          : myStatus === 'rejected'
            ? '재신청'
            : '참여 신청'}
      </button>
    );
  };

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:p-5 lg:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 via-sky-500 to-cyan-400" />

      <header className="flex min-w-0 items-start gap-3">
        <ServiceLogo
          logoUrl={party.logo_image_url}
          serviceName={party.service_name}
          fallbackName={categoryName}
          className="h-12 w-12 rounded-2xl sm:h-14 sm:w-14"
          imageClassName="p-1.5"
          iconSize={20}
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                party.status === 'recruiting'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
              }`}
            >
              {statusLabel}
            </span>

            <span
              className={`inline-flex max-w-full items-center truncate rounded-full px-2.5 py-1 text-[11px] font-bold ${
                CATEGORY_COLOR[categoryName] ??
                'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
              }`}
            >
              {categoryName}
            </span>
          </div>

          <p className="mt-2 truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
            {party.service_name || categoryName}
          </p>
        </div>
      </header>

      <section className="mt-5 min-w-0 flex-1">
        <h3 className="line-clamp-2 text-lg font-extrabold leading-snug tracking-tight text-slate-950 break-keep sm:text-xl">
          {party.title}
        </h3>
      </section>

      {monthlyPrice > 0 && (
        <section className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-400">
                월 이용료
              </p>

              {savingPct !== null && (
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-extrabold text-white">
                    {savingPct}% 절약
                  </span>

                  <span className="text-sm font-semibold text-slate-400 line-through">
                    {originalPrice.toLocaleString()}원
                  </span>
                </div>
              )}
            </div>

            <p className="shrink-0 text-2xl font-black tracking-tight text-indigo-700 sm:text-3xl">
              {monthlyPrice.toLocaleString()}원
            </p>
          </div>
        </section>
      )}

      <section className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-500">현재 인원</span>

          <div className="shrink-0 text-right">
            <span className="text-lg font-black text-slate-950">
              {memberCount}/{party.max_members ?? '?'}명
            </span>

            {pendingCount > 0 && (
              <span className="ml-1 text-xs font-bold text-amber-500">
                대기 {pendingCount}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-slate-900 transition-all duration-500 ease-out"
            style={{ width: `${activePct}%` }}
          />

          {pendingPct > 0 && (
            <div
              className="h-full bg-amber-400 transition-all duration-500 ease-out"
              style={{ width: `${pendingPct}%` }}
            />
          )}
        </div>

        <div className="mt-3 flex min-w-0 items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate text-slate-500">
            호스트 {party.host_nickname || '익명'}
          </span>

          <span className="shrink-0 font-bold text-slate-700">
            {party.status === 'recruiting'
              ? `남은 자리 ${spotsLeft}개`
              : '모집 종료'}
          </span>
        </div>
      </section>

      <footer className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onDetail(party)}
          className="min-h-11.5 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
        >
          조건 확인
        </button>

        {renderActionButton()}
      </footer>
    </article>
  );
}
