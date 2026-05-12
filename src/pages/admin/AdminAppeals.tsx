import { useEffect, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  fetchAdminAppeals,
  reviewAppeal,
  type AdminAppealOut,
} from '../../apis/admin/adminAppeals';

const FILTER_TABS = ['전체', '검토 대기', '승인', '거부'];

const TAB_TO_STATUS: Record<string, string> = {
  '검토 대기': 'PENDING',
  '승인': 'APPROVED',
  '거부': 'REJECTED',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: '검토 대기',
  APPROVED: '승인',
  REJECTED: '거부',
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  APPROVED: 'text-green-600 bg-green-50',
  REJECTED: 'text-red-500 bg-red-50',
};

const BAN_TYPE_LABEL: Record<string, string> = {
  ip_ban: 'IP 차단',
  trust_score: '신뢰도 점수',
  manual: '수동 제재',
};

// ── 메뉴얼 아코디언 ──────────────────────────────────────
type AppealsManualItem = { title: string; badge?: string; badgeColor?: string; content: React.ReactNode };

function AppealsManualAccordion({ items }: { items: AppealsManualItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {items.map((item, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div key={idx}>
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate">{item.title}</span>
                {item.badge && (
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.badgeColor ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
                className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                <div className="pt-4">{item.content}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const APPEALS_MANUAL_ITEMS: AppealsManualItem[] = [
  {
    title: '이의제기란? — 처리 흐름 개요',
    badge: '전체',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    content: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">유저가 IP 차단·신뢰도 하락·수동 제재에 불복해 관리자에게 재검토를 요청하는 기능입니다.</p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0 overflow-x-auto">
          {[
            { step: '1', label: '유저 신청', desc: '사유 작성 후 제출', color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { step: '→', label: '', desc: '', color: 'bg-transparent border-transparent text-slate-300', arrow: true },
            { step: '2', label: '검토 대기', desc: 'PENDING 상태', color: 'bg-amber-50 border-amber-200 text-amber-700' },
            { step: '→', label: '', desc: '', color: 'bg-transparent border-transparent text-slate-300', arrow: true },
            { step: '3', label: '관리자 처리', desc: '승인 또는 거부', color: 'bg-violet-50 border-violet-200 text-violet-700' },
            { step: '→', label: '', desc: '', color: 'bg-transparent border-transparent text-slate-300', arrow: true },
            { step: '4', label: '자동 적용', desc: '승인 시 제재 해제', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          ].map((s, i) =>
            s.arrow ? (
              <div key={i} className="hidden sm:flex items-center justify-center w-6 shrink-0 text-slate-300 font-bold text-lg">→</div>
            ) : (
              <div key={i} className={`flex-1 min-w-0 rounded-xl border-2 p-3 text-center ${s.color}`}>
                <p className="text-[10px] font-bold opacity-60 mb-0.5">STEP {s.step}</p>
                <p className="text-xs font-bold">{s.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{s.desc}</p>
              </div>
            )
          )}
        </div>
        <p className="text-xs text-slate-400 bg-slate-100 rounded-lg px-3 py-2">승인 시 백엔드에서 제재 유형에 따라 자동으로 IP 차단 해제, 신뢰도 점수 복구 등이 처리됩니다.</p>
      </div>
    ),
  },
  {
    title: '제재 유형별 이의제기 처리 기준',
    badge: '처리 기준',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    content: (
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">제재 유형</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">승인 시 효과</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">검토 권장 기준</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-3 py-2.5 font-semibold text-red-700">IP 차단</td>
                <td className="px-3 py-2.5 text-slate-600">해당 IP 즉시 차단 해제</td>
                <td className="px-3 py-2.5 text-slate-600">공유 IP(학교·회사·PC방) 또는 오탐지 확인 시 승인</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-semibold text-amber-700">신뢰도 점수</td>
                <td className="px-3 py-2.5 text-slate-600">차감된 점수 복구</td>
                <td className="px-3 py-2.5 text-slate-600">사유가 타당하고 반복 위반 이력이 없는 경우 승인</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-semibold text-slate-700">수동 제재</td>
                <td className="px-3 py-2.5 text-slate-600">제재 기록 취소</td>
                <td className="px-3 py-2.5 text-slate-600">관리자 오판단 또는 추가 정황 확인 시 승인</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">반복 위반 유저는 로그 탭에서 위반 이력을 먼저 확인한 뒤 신중하게 처리하세요.</p>
      </div>
    ),
  },
  {
    title: '검토 대기 건 처리하기',
    badge: '검토 대기',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    content: (
      <div className="space-y-3">
        <ol className="text-xs text-slate-600 space-y-2.5 list-none">
          {[
            { n: '1', text: '목록에서 해당 이의제기를 클릭해 상세 정보를 펼칩니다.' },
            { n: '2', text: '제재 기록(제재 유형·상세·일시), 신청자 정보(닉네임·이메일·IP), 이의제기 사유를 검토합니다.' },
            { n: '3', text: '처리하기 버튼을 클릭해 처리 모달을 엽니다.' },
            { n: '4', text: '승인(제재 해제) 또는 거부를 선택합니다.' },
            { n: '5', text: '관리자 메모를 작성합니다 (선택사항이지만 거부 시 사유 기재 권장).' },
            { n: '6', text: '확인을 누르면 즉시 처리 결과가 반영됩니다.' },
          ].map((item) => (
            <li key={item.n} className="flex items-start gap-2.5">
              <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">{item.n}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-slate-400 bg-slate-100 rounded-lg px-3 py-2">신뢰도 점수 제재의 경우, 모달에서 승인 시 몇 점이 복구되는지 미리 표시됩니다.</p>
      </div>
    ),
  },
  {
    title: '상태 필터 탭 사용법',
    badge: '탭 안내',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    content: (
      <div className="space-y-2">
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">탭</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">표시 내용</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">용도</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { tab: '전체', desc: '모든 이의제기', use: '전체 현황 파악' },
                { tab: '검토 대기', desc: 'PENDING 상태만', use: '처리해야 할 건 우선 확인', highlight: true },
                { tab: '승인', desc: 'APPROVED 처리 완료', use: '승인 이력 조회' },
                { tab: '거부', desc: 'REJECTED 처리 완료', use: '거부 이력 조회' },
              ].map((r) => (
                <tr key={r.tab} className={r.highlight ? 'bg-amber-50/60' : ''}>
                  <td className="px-3 py-2.5 font-semibold text-slate-700">{r.tab}</td>
                  <td className="px-3 py-2.5 text-slate-600">{r.desc}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 bg-slate-100 rounded-lg px-3 py-2">페이지 상단에 검토 대기 건수 알림이 표시됩니다. 매일 확인해 미처리 건이 쌓이지 않도록 관리하세요.</p>
      </div>
    ),
  },
  {
    title: '처리 시 주의사항',
    badge: '주의',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    content: (
      <div className="space-y-2">
        <ul className="text-xs text-slate-600 space-y-2 list-none">
          {[
            { text: '한 번 처리(승인/거부)한 이의제기는 상태를 되돌릴 수 없습니다. 신중하게 결정하세요.' },
            { text: '동일 유저가 반복적으로 이의제기를 제출하는 경우, 이전 처리 이력을 먼저 확인하세요.' },
            { text: '거부 시 관리자 메모에 사유를 남기면 유저가 재신청 시 참고할 수 있고 추후 분쟁 방지에도 도움이 됩니다.' },
            { text: '승인 즉시 제재가 해제됩니다. 해제 후 동일 행위가 반복되면 채팅 모더레이션 탭에서 재제재할 수 있습니다.' },
            { text: 'IP 차단 이의제기 승인 시 공유 IP일 가능성이 있으므로 신청 IP와 위반 IP가 동일한지 반드시 확인하세요.' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 bg-white rounded-lg border border-slate-100 px-3 py-2.5">
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
];

function AppealsManual() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-blue-800">이의제기 관리 운영 메뉴얼</p>
            <p className="text-xs text-blue-500 mt-0.5">처리 흐름 · 제재 유형별 기준 · 주의사항 가이드</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs font-semibold text-blue-500 bg-blue-100 rounded-full px-2.5 py-0.5 border border-blue-200">
            {APPEALS_MANUAL_ITEMS.length}개 항목
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-blue-100">
          <p className="text-xs text-slate-500 py-3">항목을 클릭해 내용을 펼쳐보세요.</p>
          <AppealsManualAccordion items={APPEALS_MANUAL_ITEMS} />
        </div>
      )}
    </div>
  );
}

const fmt = (v?: string | null) => {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminAppeals() {
  const [appeals, setAppeals] = useState<AdminAppealOut[]>([]);
  const [tab, setTab] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // 처리 모달 상태
  const [reviewing, setReviewing] = useState<AdminAppealOut | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>(
    'APPROVED',
  );
  const [adminMemo, setAdminMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const statusParam = tab === '전체' ? '' : (TAB_TO_STATUS[tab] ?? tab);
      const data = await fetchAdminAppeals(statusParam);
      setAppeals(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const handleReview = async () => {
    if (!reviewing) return;
    setIsSubmitting(true);
    setError('');
    try {
      const updated = await reviewAppeal(reviewing.id, {
        status: reviewStatus,
        admin_memo: adminMemo.trim() || undefined,
      });
      setAppeals((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      );
      setReviewing(null);
      setAdminMemo('');
    } catch (e: any) {
      setError(e?.response?.data?.detail || '처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = appeals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">이의제기 관리</h1>
        <p className="mt-1 text-sm text-slate-400">유저 제재 이의제기 검토 · 승인 · 거부 처리</p>
      </div>

      <AppealsManual />

      <AdminHeader placeholder="이의제기 검색..." />

      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          검토 대기 중인 이의제기가{' '}
          <span className="font-bold">{pendingCount}건</span> 있습니다.
        </div>
      )}

      <FilterTabs tabs={FILTER_TABS} activeTab={tab} onTabChange={setTab} />

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">
          불러오는 중...
        </div>
      ) : appeals.length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-400">
          이의제기 내역이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {appeals.map((appeal) => (
            <div
              key={appeal.id}
              className="rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {/* 헤더 행 */}
              <button
                type="button"
                onClick={() =>
                  setExpanded(expanded === appeal.id ? null : appeal.id)
                }
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">
                      {appeal.user_nickname}
                    </span>
                    <span className="text-xs text-gray-400">
                      {appeal.user_email}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {BAN_TYPE_LABEL[appeal.ban_type] ?? appeal.ban_type}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {appeal.reason}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[appeal.status] ?? ''}`}
                  >
                    {STATUS_LABEL[appeal.status] ?? appeal.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {fmt(appeal.created_at)}
                  </span>
                </div>
              </button>

              {/* 상세 펼치기 */}
              {expanded === appeal.id && (
                <div className="border-t border-gray-100 px-5 py-4 text-sm">
                  {/* 제재 기록 */}
                  <div className="mb-3 rounded-lg bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      제재 기록
                    </p>
                    {appeal.ban_detail ? (
                      <>
                        <p className="text-gray-700">{appeal.ban_detail}</p>
                        {appeal.ban_score_change !== null && (
                          <p className="mt-1 text-xs text-red-500">
                            신뢰도 변동:{' '}
                            {appeal.ban_score_change > 0 ? '+' : ''}
                            {appeal.ban_score_change}점
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          제재 일시: {fmt(appeal.ban_created_at)}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-400">제재 상세 기록 없음</p>
                    )}
                  </div>

                  {/* 신청자 정보 */}
                  <div className="mb-3 rounded-lg bg-blue-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      신청자 정보
                    </p>
                    <p className="text-sm text-gray-700">
                      닉네임: <span className="font-medium">{appeal.user_nickname}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-gray-700">
                      이메일: <span className="font-medium">{appeal.user_email}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-gray-700">
                      신청 IP: <span className="font-mono font-medium">{appeal.ip_address ?? '-'}</span>
                    </p>
                  </div>

                  {/* 이의제기 사유 */}
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      이의제기 사유
                    </p>
                    <p className="whitespace-pre-wrap text-gray-700">
                      {appeal.reason}
                    </p>
                  </div>

                  {/* 처리 결과 */}
                  {appeal.status !== 'PENDING' && (
                    <div className="mb-3 rounded-lg bg-gray-50 p-3">
                      <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        처리 결과
                      </p>
                      <p className="text-gray-700">
                        {STATUS_LABEL[appeal.status]} —{' '}
                        {appeal.reviewed_by_nickname ?? '-'}
                      </p>
                      {appeal.admin_memo && (
                        <p className="mt-1 text-xs text-gray-500">
                          {appeal.admin_memo}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {fmt(appeal.reviewed_at)}
                      </p>
                    </div>
                  )}

                  {/* 처리 버튼 */}
                  {appeal.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewing(appeal);
                        setReviewStatus('APPROVED');
                        setAdminMemo('');
                        setError('');
                      }}
                      className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      처리하기
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 처리 모달 */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              이의제기 처리
            </h3>
            <p className="mb-3 text-sm text-gray-500">
              <span className="font-semibold text-gray-700">
                {reviewing.user_nickname}
              </span>{' '}
              님의 이의제기
            </p>

            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setReviewStatus('APPROVED')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
                  reviewStatus === 'APPROVED'
                    ? 'bg-green-500 text-white'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                승인 (제재 해제)
              </button>
              <button
                type="button"
                onClick={() => setReviewStatus('REJECTED')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
                  reviewStatus === 'REJECTED'
                    ? 'bg-red-500 text-white'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                거부
              </button>
            </div>

            <textarea
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              placeholder="관리자 메모 (선택사항)"
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />

            {reviewStatus === 'APPROVED' &&
              reviewing.ban_score_change !== null && (
                <p className="mt-2 text-xs text-green-600">
                  승인 시 신뢰도 점수 {Math.abs(reviewing.ban_score_change)}점
                  복구됩니다.
                </p>
              )}

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setReviewing(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleReview}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
