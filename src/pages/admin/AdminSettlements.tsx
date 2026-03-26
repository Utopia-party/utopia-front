import { useState, useMemo } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import { settlementsData } from './data/mockData';

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

  const filtered = useMemo(() => {
    let data = settlementsData;
    if (activeTab !== '전체') {
      data = data.filter((s) => s.status === activeTab);
    }
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.partyId.toLowerCase().includes(q) ||
          s.leaderId.toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q),
      );
    }
    return data;
  }, [activeTab, search]);

  return (
    <>
      <AdminHeader
        placeholder="정산 검색 (party/leader/status)..."
        onSearch={setSearch}
      />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-1">정산 승인 관리</h1>
        <p className="text-sm text-gray-500 mb-6">
          파티별 정산 확인 · 수동 승인/거절
        </p>

        <FilterTabs
          tabs={FILTER_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  정산 ID
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
              {filtered.map((stl) => (
                <tr
                  key={stl.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3.5 text-sm">{stl.id}</td>
                  <td className="px-4 py-3.5 text-sm">{stl.partyId}</td>
                  <td className="px-4 py-3.5 text-sm">{stl.leaderId}</td>
                  <td className="px-4 py-3.5 text-sm">
                    {formatWon(stl.totalAmount)}
                  </td>
                  <td className="px-4 py-3.5 text-sm">{stl.memberCount}명</td>
                  <td className="px-4 py-3.5 text-sm">{stl.billingMonth}</td>
                  <td className="px-4 py-3.5 text-sm">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[stl.status] ?? ''}`}
                    >
                      {stl.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm">
                    <div className="flex gap-1.5 items-center">
                      {stl.status === '대기' ? (
                        <>
                          <button
                            className="px-3 py-1 rounded-md text-xs border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition"
                            onClick={() => alert(`상세: ${stl.id}`)}
                          >
                            상세
                          </button>
                          <button
                            className="px-3 py-1 rounded-md text-xs border border-blue-300 text-blue-500 hover:bg-blue-50 cursor-pointer transition"
                            onClick={() => alert(`승인: ${stl.id}`)}
                          >
                            승인
                          </button>
                          <button
                            className="px-3 py-1 rounded-md text-xs border border-red-300 text-red-500 hover:bg-red-50 cursor-pointer transition"
                            onClick={() => alert(`거절: ${stl.id}`)}
                          >
                            거절
                          </button>
                        </>
                      ) : (
                        <button
                          className="px-3 py-1 rounded-md text-xs border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition"
                          onClick={() => alert(`상세: ${stl.id}`)}
                        >
                          상세
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
            승인 시: 파티장 계좌로 정산 처리 + 알림 발송 + 관리자 활동 로그 기록
          </div>
        </div>
      </div>
    </>
  );
}
