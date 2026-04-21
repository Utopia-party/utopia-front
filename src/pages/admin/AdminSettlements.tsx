import { Fragment, useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
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
    if (activeTab === '전체') return settlements;
    return settlements.filter((s) => s.status === activeTab);
  }, [activeTab, settlements]);

  return (
    <>
      <AdminHeader
        placeholder="정산 검색 (party/leader/status)..."
        onSearch={setSearch}
      />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-1">정산 승인 관리</h1>
        <p className="text-sm text-gray-500 mb-4">
          파티별 정산 확인 · 수동 승인/거절
        </p>

        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              키워드 (파티명 / 파티장 / 정산월)
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 또는 정산월 검색"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 w-60"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">시작일</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">종료일</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </label>
          <div className="flex gap-2 pb-0.5">
            <button
              onClick={handleSearch}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              조회
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              초기화
            </button>
          </div>
        </div>

        <FilterTabs
          tabs={FILTER_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {loading && (
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
            정산 목록을 불러오는 중입니다.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
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
              {filtered.map((stl) => {
                const isExpanded = expandedSettlementId === stl.id;

                return (
                  <Fragment key={stl.id}>
                    <tr className="border-b border-gray-100 transition hover:bg-gray-50">
                      <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {stl.createdAt}
                      </td>
                      <td className="px-4 py-3.5 text-sm">{stl.partyName}</td>
                      <td className="px-4 py-3.5 text-sm">{stl.leaderName}</td>
                      <td className="px-4 py-3.5 text-sm">
                        {formatWon(stl.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        {stl.memberCount}명
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        {stl.billingMonth}
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[stl.status] ?? ''}`}
                        >
                          {stl.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        <div className="flex gap-1.5 items-center">
                          <button
                            className={`px-3 py-1 rounded-md text-xs border transition ${
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
                                className="px-3 py-1 rounded-md text-xs border border-blue-300 text-blue-500 hover:bg-blue-50 cursor-pointer transition"
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
                                className="px-3 py-1 rounded-md text-xs border border-red-300 text-red-500 hover:bg-red-50 cursor-pointer transition"
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
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="border-b border-gray-100 bg-slate-50/70">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                  정산 상세
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                  파티 정산 내역을 팝업 없이 펼쳐서 확인하고
                                  바로 승인 또는 거절할 수 있습니다.
                                </p>
                              </div>
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[stl.status] ?? ''}`}
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
                                  className="rounded-md border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
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
                                  className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                                  disabled={busySettlementId === stl.id}
                                  onClick={() =>
                                    void handleSettlementStatus(stl.id, '거절')
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-8">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
            승인과 거절 버튼은 실제 정산 관리자 API를 호출합니다.
          </div>
        </div>
      </div>
    </>
  );
}
