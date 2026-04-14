import { X, Users, Calendar, Clock, RefreshCw, Bookmark } from 'lucide-react';
import type { Party } from '../../types/party';

interface PartyDetailModalProps {
  party: Party;
  onClose: () => void;
  onApply: (party: Party) => void;
}

const CATEGORY_COLOR: Record<string, string> = {
  OTT: 'bg-blue-100 text-blue-700',
  '멤버십/음악': 'bg-green-100 text-green-700',
  '교육/도서': 'bg-purple-100 text-purple-700',
  생산성: 'bg-pink-100 text-pink-700',
  기타: 'bg-slate-100 text-slate-600',
};

export default function PartyDetailModal({
  party,
  onClose,
  onApply,
}: PartyDetailModalProps) {
  const isFull = party.status !== 'recruiting';

  const descriptionLines =
    (party as Party & { description?: string }).description
      ?.replace(/\\n/g, '\n')
      .split('\n')
      .filter(Boolean) ?? [];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 태그 바 */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-0">
          {party.category_name && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                CATEGORY_COLOR[party.category_name] ??
                'bg-slate-100 text-slate-600'
              }`}
            >
              {party.category_name}
            </span>
          )}
          {party.status === 'recruiting' && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">
              인기
            </span>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-0 p-6">
          {/* 왼쪽: 파티 정보 */}
          <div className="flex-1 pr-6 border-r border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight mb-1">
              {party.title}
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              {party.service_name && `${party.service_name} `}
              {party.max_members &&
                `${party.max_members}인 파티로 월 구독료 부담을 줄여요.`}
            </p>

            {/* 정보 카드 그리드 */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <InfoCard
                icon={<Users size={16} className="text-slate-500" />}
                label="모집 인원"
                value={`${party.member_count} / ${party.max_members ?? '?'}`}
              />
              <InfoCard
                icon={<Calendar size={16} className="text-slate-500" />}
                label="파티 시작일"
                value="2026.03.01"
              />
              <InfoCard
                icon={<Clock size={16} className="text-slate-500" />}
                label="모집 마감"
                value="2026.03.08"
              />
              <InfoCard
                icon={<RefreshCw size={16} className="text-slate-500" />}
                label="정산 주기"
                value="매월 1일"
              />
            </div>

            {/* 상세 설명 */}
            {descriptionLines.length > 0 ? (
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed">
                {descriptionLines.map((line, i) => (
                  <p key={i} className="flex gap-1.5">
                    <span className="text-slate-400 shrink-0">•</span>
                    <span>{line.replace(/^[•·\-]\s*/, '')}</span>
                  </p>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-500 italic">
                상세 설명이 없습니다.
              </div>
            )}

            {/* 하단 버튼 */}
            <div className="flex gap-2 mt-5">
              <button
                disabled={isFull}
                onClick={() => onApply(party)}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isFull
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                {isFull ? '모집 마감' : '참여신청'}
              </button>
              <button className="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
                <Bookmark size={18} className="text-slate-500" />
              </button>
            </div>
          </div>

          {/* 오른쪽: 정산 요약 + 호스트 + 안내 */}
          <div className="w-64 pl-6 flex flex-col gap-5 shrink-0">
            {/* 정산 요약 */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">
                정산 요약
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">총 비용</span>
                  <span className="font-semibold text-slate-900">
                    {party.original_price != null
                      ? `${party.original_price.toLocaleString()}원`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">1인 부담</span>
                  <span className="font-bold text-primary text-base">
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
              <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">
                호스트
              </p>
              <div className="flex flex-col gap-1.5 text-sm">
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
              <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">
                안내
              </p>
              <ul className="flex flex-col gap-1.5 text-xs text-slate-500 leading-relaxed">
                <li className="flex gap-1.5">
                  <span className="shrink-0 mt-0.5">•</span>
                  <span>참여신청 후 호스트 승인 시 파티가 확정됩니다.</span>
                </li>
                <li className="flex gap-1.5">
                  <span className="shrink-0 mt-0.5">•</span>
                  <span>
                    정산/환불 규정은 파티 상세 설명과 공지에 따릅니다.
                  </span>
                </li>
                <li className="flex gap-1.5">
                  <span className="shrink-0 mt-0.5">•</span>
                  <span>문제가 있을 경우 신고 기능을 이용해주세요.</span>
                </li>
              </ul>
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
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-[11px] text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
