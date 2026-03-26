import { useState, useMemo } from 'react';
import AdminHeader from './components/AdminHeader';
import { systemLogsData } from './data/mockData';

const TYPE_COLOR: Record<string, string> = {
  ERROR: 'text-red-500',
  ADMIN_ACTION: 'text-blue-500',
  SYSTEM: 'text-gray-500',
};

export default function AdminSystemLogs() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return systemLogsData;
    const q = search.toLowerCase();
    return systemLogsData.filter(
      (log) =>
        log.type.toLowerCase().includes(q) ||
        log.message.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <>
      <AdminHeader
        placeholder="로그 검색 (키워드/관리자/유저)..."
        onSearch={setSearch}
        rightContent={
          <button
            className="px-3.5 py-1.5 border border-gray-300 rounded-md bg-white text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => alert('로그 내보내기 (CSV) - 데모')}
          >
            Export
          </button>
        }
      />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-1">시스템 로그</h1>
        <p className="text-sm text-gray-500 mb-6">
          에러 로깅 · 관리자 활동 로그 · 감사(Audit) 추적
        </p>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  시간
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  유형
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  내용
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  주체
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3.5 text-sm">
                    <span
                      className={`font-semibold ${TYPE_COLOR[log.type] ?? 'text-gray-500'}`}
                    >
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm">{log.message}</td>
                  <td className="px-4 py-3.5 text-sm">{log.actor}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
            추천: 중요한 변경(상태변경/승인/거절)은 반드시 감사 로그로 남기기
          </div>
        </div>
      </div>
    </>
  );
}
