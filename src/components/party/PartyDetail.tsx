import {
  X,
  Users,
  Calendar,
  CalendarX,
  Shield,
  RefreshCw,
  Bookmark,
} from 'lucide-react';
import type { Party } from '../../types/party';

interface PartyDetailModalProps {
  party: Party;
  onClose: () => void;
  onApply: (party: Party) => void;
}

const CATEGORY_COLOR: Record<string, string> = {
  OTT: 'bg-blue-100 text-blue-700',
  음악: 'bg-green-100 text-green-700',
  '멤버십/음악': 'bg-green-100 text-green-700',
  '교육/도서': 'bg-purple-100 text-purple-700',
  생산성: 'bg-pink-100 text-pink-700',
  '생산성/기타': 'bg-pink-100 text-pink-700',
  기타: 'bg-slate-100 text-slate-600',
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  recruiting: { label: '모집중',  className: 'bg-emerald-100 text-emerald-700' },
  full:       { label: '마감',    className: 'bg-slate-100 text-slate-500' },
  completed:  { label: '완료',    className: 'bg-slate-100 text-slate-500' },
  active:     { label: '운영중',  className: 'bg-blue-100 text-blue-700' },
  ended:      { label: '종료',    className: 'bg-red-100 text-red-500' },
};

// ISO date(2026-03-01) → 2026.03.01 포맷
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return dateStr.slice(0, 10).replace(/-/g, '.');
}

// ISO datetime → 날짜만
function formatDatetime(datetimeStr: string | null | undefined): string {
  if (!datetimeStr) return '-';
  return datetimeStr.slice(0, 10).replace(/-/g, '.');
}

export default function PartyDetailModal({
  party,
  onClose,
  onApply,
}: PartyDetailModalProps) {
  const isFull = party.status !== 'recruiting';
  const myStatus = party.my_member_status ?? null;
  const statusInfo =
    STATUS_LABEL[party.status ?? ''] ?? STATUS_LABEL['recruiting'];

  const descriptionLines =
    (party as Party & { description?: string }).description
      ?.replace(/\\n/g, '\n')
      .split('\n')
      .filter(Boolean) ?? [];

  return (
    <div
      // 모달 바깥 여백을 확보해 모바일에서도 답답하지 않게 조절
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        // 모달 컨테이너에 flex-col 및 max-h 지정하여 내부 스크롤 활성화
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 태그 및 닫기 버튼 바 (고정) */}
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5 md:border-none">
          {party.category_name && (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold ${
                CATEGORY_COLOR[party.category_name] ??
                'bg-slate-100 text-slate-600'
              }`}
            >
              {party.category_name}
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* 본문 영역 (스크롤 가능) */}
        <div className="overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6 md:pt-0">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_256px]">
            {/* 1. 파티 정보 (모바일: 최상단 / 데스크탑: 좌측 상단) */}
            <div className="flex flex-col border-slate-100 md:border-r md:pb-6 md:pr-6">
              <h2 className="mb-1.5 break-keep text-lg font-extrabold leading-tight text-slate-900 sm:text-xl">
                {party.title}
              </h2>
              <p className="mb-5 break-keep text-xs text-slate-500 sm:text-sm">
                {party.service_name && `${party.service_name} `}
                {party.max_members &&
                  `${party.max_members}인 파티로 월 구독료 부담을 줄여요.`}
              </p>

              {/* 정보 카드 그리드 */}
              <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3">
                <InfoCard
                  icon={<Users size={16} className="text-slate-500" />}
                  label="모집 인원"
                  value={`${party.member_count} / ${party.max_members ?? '?'}`}
                />
                <InfoCard
                  icon={<Calendar size={16} className="text-slate-500" />}
                  label="파티 생성일"
                  value={formatDatetime(party.created_at)}
                />
                <InfoCard
                  icon={<Calendar size={16} className="text-slate-500" />}
                  label="파티 시작일"
                  value={formatDate(party.start_date)}
                />
                <InfoCard
                  icon={<CalendarX size={16} className="text-slate-500" />}
                  label="파티 종료일"
                  value={formatDate(party.end_date)}
                />
                <InfoCard
                  icon={<Shield size={16} className="text-slate-500" />}
                  label="최소 신뢰도"
                  value={
                    party.min_trust_score != null && party.min_trust_score > 0
                      ? `${party.min_trust_score}점 이상`
                      : '제한 없음'
                  }
                />
                <InfoCard
                  icon={<RefreshCw size={16} className="text-slate-500" />}
                  label="정산 주기"
                  value="매월 1일"
                />
              </div>

              {/* 상세 설명 */}
              {descriptionLines.length > 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 sm:text-sm">
                  {descriptionLines.map((line, i) => (
                    <p key={i} className="flex gap-1.5 break-keep">
                      <span className="shrink-0 text-slate-400">•</span>
                      <span>{line.replace(/^[•·-]\s*/, '')}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-4 text-xs italic text-slate-500 sm:text-sm">
                  상세 설명이 없습니다.
                </div>
              )}
            </div>

            {/* 2. 사이드바 요약 (모바일: 설명 아래 / 데스크탑: 우측 전체 row-span-2) */}
            <div className="mt-6 flex shrink-0 flex-col gap-5 border-t border-slate-100 pt-6 md:col-start-2 md:row-span-2 md:mt-0 md:border-t-0 md:pl-6 md:pt-0">
              {/* 정산 요약 */}
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
                  정산 요약
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-500">서비스 월 요금</span>
                    <span className="font-semibold text-slate-900">
                      {party.service_total_price != null
                        ? `${party.service_total_price.toLocaleString()}원`
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-500">1인 부담</span>
                    <span className="text-sm font-bold text-primary sm:text-base">
                      {party.monthly_price != null
                        ? `${party.monthly_price.toLocaleString()}원`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* 호스트 */}
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
                  방장
                </p>
                <div className="flex flex-col gap-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">닉네임</span>
                    <span className="font-semibold text-slate-900">
                      {party.host_nickname ?? '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">신뢰도</span>
                    <span className="font-semibold text-slate-900">
                      {party.host_trust_score != null
                        ? `${party.host_trust_score}점`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* 안내 */}
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
                  안내
                </p>
                <ul className="flex flex-col gap-1.5 break-keep text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                  <li className="flex gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>참여신청 후 방장 승인 시 파티가 확정됩니다.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>
                      정산/환불 규정은 파티 상세 설명과 공지에 따릅니다.
                    </span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>문제가 있을 경우 신고 기능을 이용해주세요.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 3. 하단 버튼 영역 (모바일: 맨 아래 / 데스크탑: 좌측 하단) */}
            <div className="mt-6 border-t border-slate-100 pt-6 md:col-start-1 md:row-start-2 md:mt-0 md:border-r md:border-t-0 md:pr-6 md:pt-0">
              <div className="flex gap-2">
                {(() => {
                  if (myStatus === 'leader') {
                    return (
                      <button
                        disabled
                        className="flex-1 cursor-not-allowed rounded-xl bg-indigo-100 py-3 text-sm font-bold text-indigo-700 sm:rounded-2xl sm:py-3.5"
                      >
                        방장
                      </button>
                    );
                  }
                  if (myStatus === 'active') {
                    return (
                      <button
                        disabled
                        className="flex-1 cursor-not-allowed rounded-xl bg-indigo-100 py-3 text-sm font-bold text-indigo-700 sm:rounded-2xl sm:py-3.5"
                      >
                        참여중
                      </button>
                    );
                  }
                  if (myStatus === 'pending') {
                    return (
                      <button
                        disabled
                        className="flex-1 cursor-not-allowed rounded-xl bg-amber-100 py-3 text-sm font-bold text-amber-700 sm:rounded-2xl sm:py-3.5"
                      >
                        승인 대기중
                      </button>
                    );
                  }
                  if (myStatus === 'kicked') {
                    return (
                      <button
                        disabled
                        className="flex-1 cursor-not-allowed rounded-xl bg-rose-100 py-3 text-sm font-bold text-rose-700 sm:rounded-2xl sm:py-3.5"
                      >
                        참여 불가 (강퇴)
                      </button>
                    );
                  }
                  return (
                    <button
                      disabled={isFull}
                      onClick={() => onApply(party)}
                      // 터치감 개선: active:scale-95 추가
                      className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 sm:rounded-2xl sm:py-3.5 ${
                        isFull
                          ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                          : 'bg-primary text-white shadow-md hover:opacity-90 hover:shadow-lg'
                      }`}
                    >
                      {isFull
                        ? '모집 마감'
                        : myStatus === 'rejected'
                          ? '재신청'
                          : '참여신청'}
                    </button>
                  );
                })()}
                <button className="flex h-11 w-11 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 transition-colors hover:bg-slate-50 active:scale-95">
                  <Bookmark size={18} className="text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    // 모바일에서는 아이콘과 텍스트 영역이 구겨지지 않게 items-center, min-w-0 부여
    <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-slate-50 p-3 sm:px-4 sm:py-3">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-[11px] font-medium text-slate-400">
          {label}
        </p>
        <p className="truncate text-xs sm:text-sm font-bold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}
