import { Fragment, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import Pagination from './components/Pagination';
import {
  fetchAdminSettlements,
  getAdminErrorMessage,
  updateAdminSettlementStatus,
  type SettlementRecord,
} from '../../apis/admin';

const STATUS_STYLE: Record<string, string> = {
  대기: 'text-amber-500 bg-amber-50',
  승인: 'text-emerald-500 bg-emerald-50',
  거절: 'text-red-500 bg-red-50',
};

const FILTER_TABS = ['전체', '대기', '승인', '거절'];

const formatWon = (amount: number) => `₩ ${amount.toLocaleString()}`;

// ── 정산 관리 메뉴얼 ─────────────────────────────────────

type SettlementManualItem = { title: string; badge?: string; badgeColor?: string; content: ReactNode };

function SettlementManualAccordion({ items }: { items: SettlementManualItem[] }) {
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

const SETTLEMENT_MANUAL_ITEMS: SettlementManualItem[] = [
  {
    title: '이 페이지의 역할',
    badge: '개요',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    content: (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">파티 단위 정산 요청을 검토하고 승인·거절로 처리하는 운영 화면입니다.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-700 mb-1">파티 정산 관리 (이 페이지)</p>
            <p>파티 단위 정산 요청 처리. 승인/거절 판단.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-700 mb-1">매출내역 관리</p>
            <p>전체 결제 흐름·수수료 확인. 개별 결제 상태 조회.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: '정산 상태 종류',
    badge: '상태',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    content: (
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">상태</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">의미</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-3 py-2.5"><span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-50">대기</span></td>
              <td className="px-3 py-2.5 text-slate-600">정산 요청 접수, 검토 전</td>
              <td className="px-3 py-2.5 text-slate-500">승인 또는 거절 처리 필요</td>
            </tr>
            <tr>
              <td className="px-3 py-2.5"><span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50">승인</span></td>
              <td className="px-3 py-2.5 text-slate-600">정산 완료 처리</td>
              <td className="px-3 py-2.5 text-slate-500">파티장에게 승인 알림 발송됨</td>
            </tr>
            <tr>
              <td className="px-3 py-2.5"><span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-red-500 bg-red-50">거절</span></td>
              <td className="px-3 py-2.5 text-slate-600">정산 불가 판정</td>
              <td className="px-3 py-2.5 text-slate-500">사유 확인 후 재요청 안내</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    title: '정산 검토 및 처리 방법',
    badge: '처리',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    content: (
      <ol className="text-xs text-slate-600 space-y-2 list-none">
        {[
          { n: '1', t: '키워드(파티명·파티장)나 날짜 범위를 입력하고 조회합니다.' },
          { n: '2', t: '대기 탭에서 처리 대기 중인 건만 필터링합니다.' },
          { n: '3', t: '상세를 눌러 정산 ID, 총액, 멤버 수, 청구월, 참여자 결제 상태를 확인합니다.' },
          { n: '4', t: '금액·결제 상태가 정상이면 승인, 이상이 있으면 거절로 처리합니다.' },
          { n: '5', t: '결제 상세가 필요하면 매출내역 관리와 파티 관리 화면을 함께 참고합니다.' },
        ].map((item) => (
          <li key={item.n} className="flex items-start gap-2.5">
            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">{item.n}</span>
            <span>{item.t}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    title: '목록 조회 및 새로고침',
    badge: '조회',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    content: (
      <div className="space-y-2.5">
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>페이지 진입 시 전체 목록을 한 번 자동 조회합니다.</li>
          <li>자동 새로고침은 동작하지 않습니다. 최신 데이터가 필요하면 우측 상단 새로고침 버튼을 누르세요.</li>
          <li>조회 버튼은 키워드·날짜 조건을 적용해 다시 불러옵니다.</li>
          <li>초기화 버튼은 모든 필터를 지우고 전체 목록을 다시 조회합니다.</li>
        </ul>
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-xs text-slate-500">
          탭 필터(대기·승인·거절)는 이미 불러온 목록을 클라이언트에서 분류합니다. 탭 전환 시 서버 재조회 없이 즉시 반응합니다.
        </div>
      </div>
    ),
  },
  {
    title: '승인 전 확인 사항',
    badge: '주의',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    content: (
      <ul className="text-xs text-slate-600 space-y-2 list-none">
        {[
          '참여자 결제 상태에서 미결제(대기) 멤버가 없는지 확인하세요.',
          '총 정산 금액이 멤버 수 × 1인 부담금과 일치하는지 검토하세요.',
          '최근 파티 운영 이슈(강퇴, 분쟁 등)가 있다면 파티 관리 화면을 먼저 확인하세요.',
          '승인 처리는 되돌릴 수 없습니다. 파티장에게 즉시 승인 알림이 발송됩니다.',
        ].map((text, i) => (
          <li key={i} className="flex items-start gap-2.5 bg-white rounded-lg border border-slate-100 px-3 py-2.5">
            <span>{text}</span>
          </li>
        ))}
      </ul>
    ),
  },
];

function SettlementManual() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-slate-50 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-emerald-800">파티 정산 관리 운영 메뉴얼</p>
            <p className="text-xs text-emerald-500 mt-0.5">정산 상태 · 검토 방법 · 조회 안내</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs font-semibold text-emerald-500 bg-emerald-100 rounded-full px-2.5 py-0.5 border border-emerald-200">
            {SETTLEMENT_MANUAL_ITEMS.length}개 항목
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-emerald-100">
          <p className="text-xs text-slate-500 py-3">항목을 클릭해 내용을 펼쳐보세요.</p>
          <SettlementManualAccordion items={SETTLEMENT_MANUAL_ITEMS} />
        </div>
      )}
    </div>
  );
}

export default function AdminSettlements() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [expandedSettlementId, setExpandedSettlementId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busySettlementId, setBusySettlementId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadSettlements = async (params?: {
    keyword?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    try {
      setLoading(true);
      setError('');
      setSettlements(await fetchAdminSettlements(params));
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettlements();
  }, []);

  const handleSearch = () => {
    setPage(1);
    void loadSettlements({
      keyword: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  const handleReset = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    void loadSettlements();
  };

  const reloadSettlements = async () => {
    void loadSettlements({
      keyword: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  const handleSettlementStatus = async (
    settlementId: string,
    status: string,
  ) => {
    try {
      setBusySettlementId(settlementId);
      await updateAdminSettlementStatus(settlementId, status);
      await reloadSettlements();
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setBusySettlementId(null);
    }
  };

  const filtered = useMemo(() => {
    if (activeTab === '전체') {
      return settlements;
    }

    return settlements.filter((settlement) => settlement.status === activeTab);
  }, [activeTab, settlements]);

  const paginated = filtered.slice((page - 1) * 20, page * 20);

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    setPage(1);
    setExpandedSettlementId(null);
  };

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col overflow-x-hidden">
      <AdminHeader
        placeholder="파티 정산 검색 (party/leader/status)..."
        onSearch={setSearch}
      />

      <main className="w-full min-w-0 flex-1 overflow-x-hidden bg-[#f5f5f5] p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 md:space-y-6">
          <section className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                  파티 정산 관리
                </h1>
                <p className="mt-1 max-w-4xl text-xs leading-relaxed text-gray-500 break-keep md:text-sm">
                  파티별 정산 요청, 정산월, 파티장, 총 정산 금액을 한 화면에서
                  확인하고 각 파티의 정산 진행 상태를 관리할 수 있게 구성했습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={reloadSettlements}
                disabled={loading}
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 active:scale-95 transition"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                새로고침
              </button>
            </div>
          </section>

          <SettlementManual />

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  키워드 (파티명 / 파티장 / 정산월)
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="이름 또는 정산월 검색"
                  className="w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </label>

              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  시작일
                </span>

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </label>

              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  종료일
                </span>

                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </label>

              <div className="grid grid-cols-2 gap-2 md:col-span-2 xl:col-span-1 xl:flex xl:justify-end">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                >
                  조회
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 active:scale-95"
                >
                  초기화
                </button>
              </div>
            </div>
          </section>

          <div className="w-full min-w-0 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <FilterTabs
              tabs={FILTER_TABS}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>

          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 shadow-sm md:px-5 md:py-4 md:text-sm">
              정산 목록을 불러오는 중입니다.
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 shadow-sm md:px-5 md:py-4 md:text-sm">
              {error}
            </div>
          )}

          <section className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="block md:hidden">
              <div className="divide-y divide-gray-100">
                {paginated.map((stl) => {
                  const isExpanded = expandedSettlementId === stl.id;

                  return (
                    <article key={stl.id} className="p-4">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-bold text-gray-900">
                            {stl.partyName}
                          </h2>

                          <p className="mt-1 text-xs text-gray-500">
                            {stl.leaderName} · {stl.billingMonth}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_STYLE[stl.status] ?? ''
                          }`}
                        >
                          {stl.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <div className="text-[11px] text-slate-400">총액</div>
                          <div className="mt-1 break-all text-sm font-semibold text-slate-900">
                            {formatWon(stl.totalAmount)}
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <div className="text-[11px] text-slate-400">
                            멤버 수
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {stl.memberCount}명
                          </div>
                        </div>

                        <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2">
                          <div className="text-[11px] text-slate-400">
                            생성 시각
                          </div>
                          <div className="mt-1 wrap-break-word text-sm font-semibold text-slate-900">
                            {stl.createdAt}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <h3 className="text-sm font-semibold text-slate-900">
                            파티 정산 상세
                          </h3>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {[
                              ['정산 ID', stl.id],
                              ['파티명', stl.partyName],
                              ['파티장', stl.leaderName],
                              ['총액', formatWon(stl.totalAmount)],
                              ['멤버 수', `${stl.memberCount}명`],
                              ['청구월', stl.billingMonth],
                              ['상태', stl.status],
                              ['생성일', stl.createdAt],
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                              >
                                <div className="text-[11px] font-medium text-slate-400">
                                  {label}
                                </div>
                                <div className="mt-1 break-all text-sm font-semibold text-slate-800">
                                  {value}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-3">
                            <div className="text-[11px] font-medium text-slate-400">
                              참여자 결제 상태
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {stl.participantPayments.length > 0 ? (
                                stl.participantPayments.map((participant) => (
                                  <span
                                    key={participant.userId}
                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                      participant.paymentStatus === '승인'
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : participant.paymentStatus === '취소'
                                          ? 'border-slate-200 bg-slate-50 text-slate-600'
                                          : participant.paymentStatus === '거절'
                                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {participant.nickname} ·{' '}
                                    {participant.paymentStatus}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-300">
                                  -
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`rounded-md border px-3 py-1.5 text-xs transition ${
                            isExpanded
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() =>
                            setExpandedSettlementId((prev) =>
                              prev === stl.id ? null : stl.id,
                            )
                          }
                        >
                          {isExpanded ? '닫기' : '상세'}
                        </button>

                        {stl.status === '대기' && (
                          <>
                            <button
                              type="button"
                              className="rounded-md border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={busySettlementId === stl.id}
                              onClick={() =>
                                void handleSettlementStatus(stl.id, '승인')
                              }
                            >
                              {busySettlementId === stl.id
                                ? '처리 중...'
                                : '승인'}
                            </button>

                            <button
                              type="button"
                              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={busySettlementId === stl.id}
                              onClick={() =>
                                void handleSettlementStatus(stl.id, '거절')
                              }
                            >
                              거절
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}

                {paginated.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:block">
              <div className="w-full min-w-0 overflow-x-auto">
                <table className="min-w-96 w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        생성 시각
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        파티
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        파티장
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        총액
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        멤버 수
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        청구월
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        상태
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        관리
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginated.map((stl) => {
                      const isExpanded = expandedSettlementId === stl.id;

                      return (
                        <Fragment key={stl.id}>
                          <tr className="border-b border-gray-100 transition hover:bg-gray-50">
                            <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                              {stl.createdAt}
                            </td>

                            <td className="max-w-45 truncate px-4 py-3.5 text-sm text-gray-900">
                              {stl.partyName}
                            </td>

                            <td className="max-w-35 truncate px-4 py-3.5 text-sm text-gray-900">
                              {stl.leaderName}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-900">
                              {formatWon(stl.totalAmount)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-900">
                              {stl.memberCount}명
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-900">
                              {stl.billingMonth}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  STATUS_STYLE[stl.status] ?? ''
                                }`}
                              >
                                {stl.status}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 text-sm">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  className={`rounded-md border px-3 py-1 text-xs transition ${
                                    isExpanded
                                      ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                  onClick={() =>
                                    setExpandedSettlementId((prev) =>
                                      prev === stl.id ? null : stl.id,
                                    )
                                  }
                                >
                                  {isExpanded ? '닫기' : '상세'}
                                </button>

                                {stl.status === '대기' && (
                                  <>
                                    <button
                                      type="button"
                                      className="cursor-pointer rounded-md border border-blue-300 px-3 py-1 text-xs text-blue-500 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      disabled={busySettlementId === stl.id}
                                      onClick={() =>
                                        void handleSettlementStatus(
                                          stl.id,
                                          '승인',
                                        )
                                      }
                                    >
                                      {busySettlementId === stl.id
                                        ? '처리 중...'
                                        : '승인'}
                                    </button>

                                    <button
                                      type="button"
                                      className="cursor-pointer rounded-md border border-red-300 px-3 py-1 text-xs text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      disabled={busySettlementId === stl.id}
                                      onClick={() =>
                                        void handleSettlementStatus(
                                          stl.id,
                                          '거절',
                                        )
                                      }
                                    >
                                      거절
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="border-b border-gray-100 bg-slate-50/70">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <h3 className="text-base font-semibold text-slate-900">
                                        파티 정산 상세
                                      </h3>

                                      <p className="mt-1 text-sm text-slate-500">
                                        파티 정산 내역을 팝업 없이 펼쳐서
                                        확인하고 바로 승인 또는 거절까지 처리할
                                        수 있습니다.
                                      </p>
                                    </div>

                                    <span
                                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        STATUS_STYLE[stl.status] ?? ''
                                      }`}
                                    >
                                      {stl.status}
                                    </span>
                                  </div>

                                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    {[
                                      ['정산 ID', stl.id],
                                      ['파티명', stl.partyName],
                                      ['파티장', stl.leaderName],
                                      ['총액', formatWon(stl.totalAmount)],
                                      ['멤버 수', `${stl.memberCount}명`],
                                      ['청구월', stl.billingMonth],
                                      ['상태', stl.status],
                                      ['생성일', stl.createdAt],
                                    ].map(([label, value]) => (
                                      <div
                                        key={label}
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                      >
                                        <div className="text-xs font-medium text-slate-400">
                                          {label}
                                        </div>

                                        <div className="mt-1 break-all text-sm font-semibold text-slate-800">
                                          {value}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <div className="text-xs font-medium text-slate-400">
                                      참여자 결제 상태
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {stl.participantPayments.length > 0 ? (
                                        stl.participantPayments.map(
                                          (participant) => (
                                            <span
                                              key={participant.userId}
                                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                                participant.paymentStatus ===
                                                '승인'
                                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                  : participant.paymentStatus ===
                                                      '취소'
                                                    ? 'border-slate-200 bg-slate-50 text-slate-600'
                                                    : participant.paymentStatus ===
                                                        '거절'
                                                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                                                      : 'border-amber-200 bg-amber-50 text-amber-700'
                                              }`}
                                            >
                                              {participant.nickname} ·{' '}
                                              {participant.paymentStatus}
                                            </span>
                                          ),
                                        )
                                      ) : (
                                        <span className="text-xs text-slate-300">
                                          참여자 결제 정보가 없습니다.
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {stl.status === '대기' && (
                                    <div className="mt-5 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        className="rounded-md border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={busySettlementId === stl.id}
                                        onClick={() =>
                                          void handleSettlementStatus(
                                            stl.id,
                                            '승인',
                                          )
                                        }
                                      >
                                        {busySettlementId === stl.id
                                          ? '처리 중...'
                                          : '승인'}
                                      </button>

                                      <button
                                        type="button"
                                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={busySettlementId === stl.id}
                                        onClick={() =>
                                          void handleSettlementStatus(
                                            stl.id,
                                            '거절',
                                          )
                                        }
                                      >
                                        거절
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}

                    {paginated.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-sm text-gray-400"
                        >
                          검색 결과가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-gray-100">
              <Pagination
                total={filtered.length}
                page={page}
                pageSize={20}
                onChange={(nextPage) => {
                  setPage(nextPage);
                  setExpandedSettlementId(null);
                }}
              />
            </div>

            <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
              승인과 거절 버튼은 실제 파티 정산 관리자 API를 호출합니다.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
