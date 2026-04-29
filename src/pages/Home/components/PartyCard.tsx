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
  const spotsLeft = Math.max(
    (party.max_members ?? 0) - (party.member_count ?? 0),
    0,
  );

  const savingPct =
    party.original_price && party.original_price > (party.monthly_price ?? 0)
      ? Math.round(
          (1 - (party.monthly_price ?? 0) / party.original_price) * 100,
        )
      : null;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 via-sky-500 to-cyan-400" />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ServiceLogo
            logoUrl={party.logo_image_url}
            serviceName={party.service_name}
            fallbackName={categoryName}
          />
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap gap-1.5">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${party.status === 'recruiting' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/80'}`}
              >
                {STATUS_LABEL[party.status ?? ''] || '모집중'}
              </span>
              <span
                className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${CATEGORY_COLOR[categoryName] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'}`}
              >
                {categoryName}
              </span>
            </div>
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
              {party.service_name}
            </p>
          </div>
        </div>

        {party.monthly_price != null && party.monthly_price > 0 ? (
          <div className="shrink-0 rounded-2xl bg-indigo-50 px-3 py-2 text-right ring-1 ring-indigo-100">
            {savingPct !== null ? (
              <div className="mb-1 flex items-center justify-end gap-1.5">
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {savingPct}% 절약
                </span>
                <span className="text-[11px] text-slate-400 line-through">
                  {party.original_price!.toLocaleString()}원
                </span>
              </div>
            ) : (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
                월 이용료
              </p>
            )}
            <p className="text-sm font-extrabold text-indigo-700">
              {party.monthly_price.toLocaleString()}원
            </p>
          </div>
        ) : null}
      </div>

      <h3 className="min-h-13 text-base font-bold leading-snug text-slate-900 line-clamp-2">
        {party.title}
      </h3>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-500">현재 인원</span>
          <span className="font-extrabold text-slate-900">
            {party.member_count}/{party.max_members ?? '?'}명
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{
              width: `${Math.min(100, party.max_members ? (party.member_count / party.max_members) * 100 : 0)}%`,
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>호스트 {party.host_nickname || '익명'}</span>
          <span>
            {party.status === 'recruiting'
              ? `남은 자리 ${spotsLeft}개`
              : '모집 종료'}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onDetail(party)}
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          조건 확인
        </button>
        {isJoined ? (
          <button
            onClick={() => navigate(`/party/${party.id}/chat`)}
            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
          >
            채팅방 입장
          </button>
        ) : myStatus === 'pending' ? (
          <button
            disabled
            className="flex-1 cursor-not-allowed rounded-2xl bg-amber-100 px-4 py-3 text-sm font-bold text-amber-700"
          >
            승인 대기중
          </button>
        ) : myStatus === 'kicked' ? (
          <button
            disabled
            className="flex-1 cursor-not-allowed rounded-2xl bg-rose-100 px-4 py-3 text-sm font-bold text-rose-700"
          >
            참여 불가 (강퇴)
          </button>
        ) : (
          <button
            disabled={isClosed}
            onClick={() => onApply(party)}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition ${isClosed ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          >
            {isClosed
              ? STATUS_LABEL[party.status ?? ''] || '마감'
              : myStatus === 'rejected'
                ? '재신청'
                : '참여 신청'}
          </button>
        )}
      </div>
    </div>
  );
}
