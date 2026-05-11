import { Fragment, useEffect, useMemo, useState } from 'react';
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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

    const timer = setInterval(() => {
      void loadSettlements();
    }, 30_000);

    return () => clearInterval(timer);
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
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
              파티 정산 관리
            </h1>

            <p className="mt-1 max-w-4xl text-xs leading-relaxed text-gray-500 break-keep md:text-sm">
              파티별 정산 요청, 정산월, 파티장, 총 정산 금액을 한 화면에서
              확인하고 각 파티의 정산 진행 상태를 관리할 수 있게 구성했습니다.
              매출내역 관리가 전체 결제 흐름을 보는 화면이라면, 이 페이지는 파티
              단위 정산 건을 처리하는 운영 화면입니다.
            </p>
          </section>

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

          <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm md:rounded-2xl">
            <button
              type="button"
              onClick={() => setIsGuideOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div className="text-[11px] font-semibold text-slate-500 md:text-xs">
                파티 정산 관리 메뉴얼
              </div>
              <span className="shrink-0 text-xs font-bold text-slate-500">
                {isGuideOpen ? '접기' : '펼치기'}
              </span>
            </button>

            {isGuideOpen && (
              <div className="mt-3 space-y-3 text-[11px] text-slate-600 md:text-xs">
                <div className="rounded-xl border border-white bg-white px-4 py-4">
                  <div className="text-sm font-bold text-slate-900">
                    파티 정산 관리 메뉴얼
                  </div>
                  <p className="mt-2 leading-relaxed">
                    이 페이지는 파티별 정산 요청을 검토하고 처리하는 운영
                    화면입니다. 전체 결제 흐름과 수익 확인은 매출내역 관리에서
                    보고, 실제로 어느 파티의 정산을 승인하거나 보류할지는 여기서
                    판단하면 됩니다.
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-white bg-white px-4 py-4">
                    <div className="font-bold text-slate-800">
                      이 페이지에서 할 수 있는 기능
                    </div>
                    <div className="mt-2 space-y-2 leading-relaxed">
                      <p>
                        1. 파티명, 파티장, 청구월 기준으로 정산 대상을 찾아볼 수
                        있습니다.
                      </p>
                      <p>
                        2. 대기, 승인, 거절 상태별로 파티 정산 요청을 분류해서
                        볼 수 있습니다.
                      </p>
                      <p>
                        3. 각 파티의 총 정산 금액, 멤버 수, 청구월, 생성 시각을
                        확인할 수 있습니다.
                      </p>
                      <p>
                        4. 대기 중인 파티 정산 건을 승인 또는 거절로 처리할 수
                        있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white bg-white px-4 py-4">
                    <div className="font-bold text-slate-800">사용 방법</div>
                    <div className="mt-2 space-y-2 leading-relaxed">
                      <p>
                        1. 먼저 파티명이나 파티장 이름으로 정산 대상을 좁혀서
                        필요한 건만 확인합니다.
                      </p>
                      <p>
                        2. 목록에서 `상세`를 눌러 파티 정산 ID, 총액, 멤버 수,
                        청구월을 다시 검토합니다.
                      </p>
                      <p>
                        3. 운영 검토가 끝난 건은 `승인`, 문제가 있는 건은
                        `거절`로 처리합니다.
                      </p>
                      <p>
                        4. 금액 근거나 결제 상태를 더 확인해야 하면 매출내역
                        관리와 파티관리 화면을 함께 보고 판단합니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-4">
                  <div className="font-bold text-slate-800">운영 시 참고</div>
                  <div className="mt-2 space-y-1.5 leading-relaxed text-slate-600">
                    <p>
                      매출내역 관리는 전체 결제와 수수료 흐름을 확인하는
                      화면이고, 파티 정산 관리는 파티 단위 정산 요청을 처리하는
                      화면입니다.
                    </p>
                    <p>
                      정산 승인 전에는 해당 파티의 결제 상태와 최근 운영 이슈를
                      함께 확인하는 것이 안전합니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

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
