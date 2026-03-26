import { useState, useMemo } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import { reportsData } from './data/mockData';

const STATUS_STYLE: Record<string, string> = {
  접수: 'text-amber-500 bg-amber-50',
  처리: 'text-blue-500 bg-blue-50',
  기각: 'text-red-500 bg-red-50',
  이의제기: 'text-violet-500 bg-violet-50',
  AI처리: 'text-blue-500 bg-blue-50',
};

const FILTER_TABS = ['전체', '접수', '처리', '기각', '이의제기', 'AI처리'];

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let data = reportsData;
    if (activeTab !== '전체') {
      data = data.filter((r) => r.status === activeTab);
    }
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.target.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q),
      );
    }
    return data;
  }, [activeTab, search]);

  return (
    <>
      <AdminHeader
        placeholder="신고 검색 (대상/사유/상태)..."
        onSearch={setSearch}
      />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-1">신고 관리</h1>
        <p className="text-sm text-gray-500 mb-6">
          신고 조회 · 처리/기각 · 사용자 패널티 연동
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
                  유형
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  대상
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  사유
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  상태
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  내용
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3.5 text-sm">{report.type}</td>
                  <td className="px-4 py-3.5 text-sm">{report.target}</td>
                  <td className="px-4 py-3.5 text-sm">{report.reason}</td>
                  <td className="px-4 py-3.5 text-sm">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[report.status] ?? ''}`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm">{report.content}</td>
                  <td className="px-4 py-3.5 text-sm">
                    <div className="flex gap-1.5 items-center">
                      <button
                        className="px-3 py-1 rounded-md text-xs border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => alert(`${report.id} 상세 보기`)}
                      >
                        상세
                      </button>
                      {report.status === '접수' && (
                        <>
                          <button
                            className="px-3 py-1 rounded-md text-xs border border-blue-400 bg-blue-500 text-white hover:bg-blue-600 cursor-pointer transition"
                            onClick={() => alert(`${report.id} 처리 진행`)}
                          >
                            처리
                          </button>
                          <button
                            className="px-3 py-1 rounded-md text-xs border border-red-300 text-red-500 hover:bg-red-50 cursor-pointer transition"
                            onClick={() => alert(`${report.id} 기각 처리`)}
                          >
                            기각
                          </button>
                        </>
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
            "처리" 시 추천 흐름: 패널티(경고/정지) 적용 + 신뢰도 감점 +
            사용자/신고 로그 기록
          </div>
        </div>
      </div>
    </>
  );
}
