import { useState, useMemo } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import { receiptsData } from './data/mockData';

const STATUS_STYLE: Record<string, string> = {
  대기: 'text-amber-500 bg-amber-50',
  승인: 'text-emerald-500 bg-emerald-50',
  거절: 'text-red-500 bg-red-50',
};

const FILTER_TABS = ['전체', '대기', '승인', '거절'];

const formatWon = (amount: number) => `₩ ${amount.toLocaleString()}`;

export default function AdminReceipts() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let data = receiptsData;
    if (activeTab !== '전체') {
      data = data.filter((r) => r.status === activeTab);
    }
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.userId.toLowerCase().includes(q) ||
          r.partyId.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q),
      );
    }
    return data;
  }, [activeTab, search]);

  return (
    <>
      <AdminHeader
        placeholder="영수증 검색 (user/party/status)..."
        onSearch={setSearch}
      />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-1">영수증 승인 관리</h1>
        <p className="text-sm text-gray-500 mb-6">
          OCR 결과 확인 · 수동 승인/거절
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
                  Receipt ID
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  사용자
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  파티
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  OCR 금액
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
              {filtered.map((receipt) => (
                <tr
                  key={receipt.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3.5 text-sm">{receipt.id}</td>
                  <td className="px-4 py-3.5 text-sm">{receipt.userId}</td>
                  <td className="px-4 py-3.5 text-sm">{receipt.partyId}</td>
                  <td className="px-4 py-3.5 text-sm">
                    {formatWon(receipt.ocrAmount)}
                  </td>
                  <td className="px-4 py-3.5 text-sm">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[receipt.status] ?? ''}`}
                    >
                      {receipt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm">
                    <div className="flex gap-1.5 items-center">
                      {receipt.status === '대기' ? (
                        <>
                          <button
                            className="px-3 py-1 rounded-md text-xs border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition"
                            onClick={() =>
                              alert(`OCR 결과 확인: ${receipt.id}`)
                            }
                          >
                            OCR 확인
                          </button>
                          <button
                            className="px-3 py-1 rounded-md text-xs border border-blue-300 text-blue-500 hover:bg-blue-50 cursor-pointer transition"
                            onClick={() => alert(`승인: ${receipt.id}`)}
                          >
                            승인
                          </button>
                          <button
                            className="px-3 py-1 rounded-md text-xs border border-red-300 text-red-500 hover:bg-red-50 cursor-pointer transition"
                            onClick={() => alert(`거절: ${receipt.id}`)}
                          >
                            거절
                          </button>
                        </>
                      ) : (
                        <button
                          className="px-3 py-1 rounded-md text-xs border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition"
                          onClick={() => alert(`상세: ${receipt.id}`)}
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
                  <td colSpan={6} className="text-center text-gray-400 py-8">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
            승인 시: 결제/정산 상태 업데이트 + 알림 발송 + 관리자 활동 로그 기록
          </div>
        </div>
      </div>
    </>
  );
}
