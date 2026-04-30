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

  // 인원 수 및 퍼센트 계산
  const maxMembers = party.max_members ?? 0;
  const memberCount = party.member_count ?? 0;
  const pendingCount = party.pending_count ?? 0;
  const spotsLeft = Math.max(maxMembers - memberCount, 0);

  const savingPct =
    party.original_price && party.original_price > (party.monthly_price ?? 0)
      ? Math.round(
          (1 - (party.monthly_price ?? 0) / party.original_price) * 100,
        )
      : null;

  // 활성 인원 바 비율 (최대 100%)
  const activePct =
    maxMembers > 0 ? Math.min(100, (memberCount / maxMembers) * 100) : 0;
  // 대기 인원 바 비율 (활성 바를 제외한 나머지 공간에서만 렌더링되도록 방어 로직)
  const pendingPct =
    maxMembers > 0
      ? Math.min(100 - activePct, (pendingCount / maxMembers) * 100)
      : 0;

  return (
    // 모바일 최적화: 패딩 살짝 조정 (p-4 sm:p-5), 모서리 둥글기 일관성
    <div className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 via-sky-500 to-cyan-400" />

      {/* 상단 뱃지 및 로고 영역 */}
      <div className="mb-3 flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          {/* 로고 크기도 모바일에서 약간 작게 대응 가능하도록 ServiceLogo 내부에 클래스 적용을 추천하나, 여기선 래퍼로 제어 */}
          <div className="shrink-0">
            <ServiceLogo
              logoUrl={party.logo_image_url}
              serviceName={party.service_name}
              fallbackName={categoryName}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap gap-1 sm:gap-1.5">
              <span
                className={`inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold ${
                  party.status === 'recruiting'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
                    : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/80'
                }`}
              >
                {STATUS_LABEL[party.status ?? ''] || '모집중'}
              </span>
              <span
                className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold ${
                  CATEGORY_COLOR[categoryName] ??
                  'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
                }`}
              >
                {categoryName}
              </span>
            </div>
            <p className="truncate text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-400">
              {party.service_name}
            </p>
          </div>
        </div>

        {/* 가격 영역 */}
        {party.monthly_price != null && party.monthly_price > 0 ? (
          <div className="shrink-0 rounded-xl sm:rounded-2xl bg-indigo-50 px-2 py-1.5 sm:px-3 sm:py-2 text-right ring-1 ring-indigo-100">
            {savingPct !== null ? (
              <div className="mb-0.5 sm:mb-1 flex items-center justify-end gap-1 sm:gap-1.5">
                <span className="rounded-full bg-red-500 px-1 py-0.5 sm:px-1.5 sm:py-0.5 text-[9px] sm:text-[10px] font-bold text-white">
                  {savingPct}% 절약
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">
                  {party.original_price!.toLocaleString()}원
                </span>
              </div>
            ) : (
              <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
                월 이용료
              </p>
            )}
            <p className="text-sm sm:text-base font-extrabold text-indigo-700">
              {party.monthly_price.toLocaleString()}원
            </p>
          </div>
        ) : null}
      </div>

      {/* 파티 제목 영역: flex-1을 주어 아래 영역을 밀어내어 카드 높이를 균일하게 맞춤 */}
      <div className="flex-1">
        <h3 className="line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem] text-sm sm:text-base font-bold leading-snug text-slate-900 break-keep">
          {party.title}
        </h3>
      </div>

      {/* 인원 현황 영역 */}
      <div className="mt-4 rounded-xl sm:rounded-2xl bg-slate-50 p-2.5 sm:p-3 ring-1 ring-slate-100">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-medium text-slate-500">현재 인원</span>
          <div className="text-right">
            <span className="font-extrabold text-slate-900">
              {memberCount}/{party.max_members ?? '?'}명
            </span>
            {pendingCount > 0 && (
              <span className="ml-1 sm:ml-1.5 text-[11px] sm:text-xs font-bold text-amber-500">
                (대기 {pendingCount}명)
              </span>
            )}
          </div>
        </div>

        {/* 프로그레스 바 (모바일에서 조금 더 도톰하게 시인성 확보) */}
        <div className="mt-2 flex h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
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

        <div className="mt-2 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
          <span className="truncate pr-2">
            호스트 {party.host_nickname || '익명'}
          </span>
          <span className="shrink-0 font-medium text-slate-700">
            {party.status === 'recruiting'
              ? `남은 자리 ${spotsLeft}개`
              : '모집 종료'}
          </span>
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onDetail(party)}
          // 모바일 터치 최적화: active:scale-95
          className="flex-1 rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
        >
          조건 확인
        </button>
        {isJoined ? (
          <button
            onClick={() => navigate(`/party/${party.id}/chat`)}
            className="flex-1 rounded-xl sm:rounded-2xl bg-indigo-600 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-indigo-500 active:scale-95"
          >
            채팅방 입장
          </button>
        ) : myStatus === 'pending' ? (
          <button
            disabled
            className="flex-1 cursor-not-allowed rounded-xl sm:rounded-2xl bg-amber-100 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-amber-700"
          >
            승인 대기중
          </button>
        ) : myStatus === 'kicked' ? (
          <button
            disabled
            className="flex-1 cursor-not-allowed rounded-xl sm:rounded-2xl bg-rose-100 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-rose-700"
          >
            참여 불가
          </button>
        ) : (
          <button
            disabled={isClosed}
            onClick={() => onApply(party)}
            className={`flex-1 rounded-xl sm:rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition active:scale-95 ${
              isClosed
                ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg'
            }`}
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
