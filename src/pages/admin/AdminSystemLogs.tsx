import { useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import {
  fetchAdminLogs,
  getAdminErrorMessage,
  type SystemLogRecord,
} from '../../apis/admin';

const TYPE_COLOR: Record<string, string> = {
  ERROR: 'text-red-500',
  ADMIN_ACTION: 'text-blue-500',
  SYSTEM: 'text-gray-500',
};

export default function AdminSystemLogs() {
  const [search, setSearch] = useState('');
  const [logType, setLogType] = useState('전체');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [logs, setLogs] = useState<SystemLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async (params?: {
    keyword?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    try {
      setLoading(true);
      setError('');
      setLogs(await fetchAdminLogs(params));
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const handleSearch = () => {
    void loadLogs({
      keyword: search || undefined,
      type: logType !== '전체' ? logType : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  const handleReset = () => {
    setSearch('');
    setLogType('전체');
    setDateFrom('');
    setDateTo('');
    void loadLogs();
  };

  const filtered = useMemo(() => logs, [logs]);

  const handleExport = () => {
    const header = ['timestamp', 'type', 'message', 'actor'];
    const csvRows = [
      header.join(','),
      ...filtered.map((log) =>
        [log.timestamp, log.type, log.message, log.actor]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AdminHeader
        placeholder="로그 검색 (키워드/관리자/유저)..."
        onSearch={setSearch}
        rightContent={
          <button
            className="px-3.5 py-1.5 border border-gray-300 rounded-md bg-white text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition"
            onClick={handleExport}
          >
            Export
          </button>
        }
      />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-1">시스템 로그</h1>
        <p className="text-sm text-gray-500 mb-4">
          에러 로깅 · 관리자 활동 로그 · 감사(Audit) 추적
        </p>

        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              키워드 (메시지 / 주체)
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="로그 내용 검색"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 w-52"
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
            <span className="text-xs font-medium text-gray-500">유형</span>
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              <option value="전체">전체</option>
              <option value="ADMIN_ACTION">관리자 활동</option>
              <option value="ERROR">에러</option>
              <option value="INFO">정보</option>
              <option value="WARN">경고</option>
            </select>
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

        {loading && (
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
            시스템 로그를 불러오는 중입니다.
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
            현재 검색 결과를 CSV로 바로 내려받을 수 있습니다.
          </div>
        </div>
      </div>
    </>
  );
}
