import { Fragment, useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  fetchAdminReports,
  getAdminErrorMessage,
  updateAdminReportStatus,
  type ReportRecord,
} from '../../apis/admin';

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
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyReportId, setBusyReportId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadReports = async () => {
      try {
        setLoading(true);
        setError('');
        const nextReports = await fetchAdminReports();
        if (alive) {
          setReports(nextReports);
        }
      } catch (err) {
        if (alive) {
          setError(getAdminErrorMessage(err));
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void loadReports();
    return () => {
      alive = false;
    };
  }, []);

  const reloadReports = async () => {
    setLoading(true);
    setError('');
    try {
      setReports(await fetchAdminReports());
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReportStatus = async (reportId: string, status: string) => {
    try {
      setBusyReportId(reportId);
      await updateAdminReportStatus(reportId, status);
      await reloadReports();
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setBusyReportId(null);
    }
  };

  const filtered = useMemo(() => {
    let data = reports;
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
  }, [activeTab, reports, search]);

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

        {loading && (
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
            신고 목록을 불러오는 중입니다.
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
              {filtered.map((report) => {
                const isExpanded = expandedReportId === report.id;

                return (
                  <Fragment key={report.id}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
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
                            className={`px-3 py-1 rounded-md text-xs border transition ${
                              isExpanded
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() =>
                              setExpandedReportId((prev) =>
                                prev === report.id ? null : report.id,
                              )
                            }
                          >
                            {isExpanded ? '닫기' : '상세'}
                          </button>
                          {report.status === '접수' && (
                            <>
                              <button
                                className="px-3 py-1 rounded-md text-xs border border-blue-400 bg-blue-500 text-white hover:bg-blue-600 cursor-pointer transition"
                                disabled={busyReportId === report.id}
                                onClick={() =>
                                  void handleReportStatus(report.id, '처리')
                                }
                              >
                                {busyReportId === report.id
                                  ? '처리 중...'
                                  : '처리'}
                              </button>
                              <button
                                className="px-3 py-1 rounded-md text-xs border border-red-300 text-red-500 hover:bg-red-50 cursor-pointer transition"
                                disabled={busyReportId === report.id}
                                onClick={() =>
                                  void handleReportStatus(report.id, '기각')
                                }
                              >
                                기각
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="border-b border-gray-100 bg-slate-50/70">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                  신고 상세
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                  신고 내용과 접수 맥락을 패널 안에서 확인하고
                                  바로 처리합니다.
                                </p>
                              </div>
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[report.status] ?? ''}`}
                              >
                                {report.status}
                              </span>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              {[
                                ['신고 ID', report.id],
                                ['유형', report.type],
                                ['대상', report.target],
                                ['사유', report.reason],
                                ['상태', report.status],
                                ['접수일', report.createdAt],
                                ['내용', report.content || '-'],
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
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
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
            처리와 기각 버튼은 실제 관리자 신고 상태 API를 호출합니다.
          </div>
        </div>
      </div>
    </>
  );
}
