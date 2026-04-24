import { Fragment, useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import Pagination from './components/Pagination';
import {
  fetchAdminReports,
  getAdminErrorMessage,
  updateAdminReportStatus,
  type AdminReportEvidenceRecord,
  type ReportRecord,
} from '../../apis/admin-report';

const STATUS_STYLE: Record<string, string> = {
  접수: 'text-amber-500 bg-amber-50',
  검토중: 'text-violet-500 bg-violet-50',
  처리: 'text-blue-500 bg-blue-50',
  기각: 'text-red-500 bg-red-50',
};

const FILTER_TABS = ['전체', '접수', '검토중', '처리', '기각'];

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFileSize = (size?: number | null) => {
  if (!size) return '-';
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
};

const isImageEvidence = (contentType?: string | null) =>
  Boolean(contentType?.startsWith('image/'));

const getActionResultLabel = (code?: string | null) => {
  switch (code) {
    case 'NONE':
      return '아직 처리 결과가 없습니다.';
    case 'WARNING':
      return '경고 조치';
    case 'SUSPENDED':
      return '이용 제한';
    case 'BANNED':
      return '영구 제한';
    case 'NO_ACTION':
      return '조치 없음';
    default:
      return code ?? '-';
  }
};

function EvidencePreview({
  evidence,
}: {
  evidence: AdminReportEvidenceRecord;
}) {
  const isImage = isImageEvidence(evidence.contentType);
  const hasUrl = Boolean(evidence.url);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex h-44 items-center justify-center bg-slate-100">
        {isImage && hasUrl ? (
          <a
            href={evidence.url ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="h-full w-full"
          >
            <img
              src={evidence.url ?? ''}
              alt={evidence.originalFilename ?? '신고 증빙 이미지'}
              className="h-full w-full object-cover"
            />
          </a>
        ) : hasUrl ? (
          <a
            href={evidence.url ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-center transition hover:bg-slate-200"
          >
            <span className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
              PDF
            </span>
            <span className="px-4 text-xs font-semibold text-slate-600">
              새 탭에서 파일 열기
            </span>
          </a>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-bold text-slate-500">
              NO URL
            </span>
            <span className="text-xs text-slate-400">조회 URL이 없습니다.</span>
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <p className="truncate text-sm font-bold text-slate-800">
            {evidence.originalFilename ?? '첨부 파일'}
          </p>
          <span className="shrink-0 text-xs font-semibold text-slate-400">
            {formatFileSize(evidence.fileSize)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
          <span>{evidence.contentType ?? 'unknown'}</span>
          <span>·</span>
          <span>{formatDateTime(evidence.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyReportId, setBusyReportId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadReports = async (params?: {
    keyword?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    try {
      setLoading(true);
      setError('');
      const nextReports = await fetchAdminReports(params);
      setReports(nextReports);
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const handleSearch = () => {
    setPage(1);
    void loadReports({
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
    void loadReports();
  };

  const reloadReports = async () => {
    await loadReports({
      keyword: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
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
    if (activeTab === '전체') return reports;
    return reports.filter((r) => r.status === activeTab);
  }, [activeTab, reports]);

  const paginated = filtered.slice((page - 1) * 20, page * 20);

  return (
    <>
      <AdminHeader
        placeholder="신고 검색 (대상/사유/상태)..."
        onSearch={setSearch}
      />
      <div className="p-8">
        <h1 className="mb-1 text-2xl font-bold">신고 관리</h1>
        <p className="mb-4 text-sm text-gray-500">
          신고 접수 시각, 대상, 사유, 처리 상태와 증빙 자료를 한 화면에서
          확인하고 운영 조치까지 바로 연결할 수 있게 구성했습니다.
        </p>

        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">키워드</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="대상 이름 / 사유 / 상태"
              className="w-52 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
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
              type="button"
              onClick={handleSearch}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              조회
            </button>
            <button
              type="button"
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
          onTabChange={(tab) => {
            setActiveTab(tab);
            setPage(1);
          }}
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

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  접수 시각
                </th>
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
                  첨부
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
              {paginated.map((report) => {
                const isExpanded = expandedReportId === report.id;

                return (
                  <Fragment key={report.id}>
                    <tr className="border-b border-gray-100 transition hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                        {formatDateTime(report.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-sm">{report.type}</td>
                      <td className="px-4 py-3.5 text-sm">{report.target}</td>
                      <td className="px-4 py-3.5 text-sm">{report.reason}</td>
                      <td className="px-4 py-3.5 text-sm">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_STYLE[report.status] ?? ''
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        {report.evidences.length > 0 ? (
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {report.evidences.length}개
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">없음</span>
                        )}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3.5 text-sm">
                        {report.content}
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className={`rounded-md border px-3 py-1 text-xs transition ${
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
                                type="button"
                                className="cursor-pointer rounded-md border border-blue-400 bg-blue-500 px-3 py-1 text-xs text-white transition hover:bg-blue-600 disabled:opacity-60"
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
                                type="button"
                                className="cursor-pointer rounded-md border border-red-300 px-3 py-1 text-xs text-red-500 transition hover:bg-red-50 disabled:opacity-60"
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
                        <td colSpan={8} className="px-4 py-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                  신고 상세
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                  신고 내용, 접수 맥락, 증빙 파일을 확인하고
                                  바로 처리합니다.
                                </p>
                              </div>
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  STATUS_STYLE[report.status] ?? ''
                                }`}
                              >
                                {report.status}
                              </span>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              {[
                                ['신고 ID', report.id],
                                [
                                  '신고자',
                                  report.reporterNickname ??
                                    report.reporterId ??
                                    '-',
                                ],
                                ['유형', report.type],
                                ['대상', report.target],
                                ['사유', report.reason],
                                ['상태', report.status],
                                ['접수일', formatDateTime(report.createdAt)],
                                ['검토일', formatDateTime(report.reviewedAt)],
                                [
                                  '처리 결과',
                                  getActionResultLabel(report.actionResultCode),
                                ],
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

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="text-xs font-medium text-slate-400">
                                신고 내용
                              </div>
                              <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                                {report.content || '-'}
                              </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <h4 className="text-sm font-bold text-slate-900">
                                  증빙 파일
                                </h4>
                                <span className="text-xs font-semibold text-slate-400">
                                  {report.evidences.length}개
                                </span>
                              </div>

                              {report.evidences.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                                  첨부된 증빙 파일이 없습니다.
                                </div>
                              ) : (
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                  {report.evidences.map((evidence) => (
                                    <EvidencePreview
                                      key={evidence.id}
                                      evidence={evidence}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            {report.adminMemo && (
                              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <div className="text-xs font-medium text-blue-500">
                                  관리자 메모
                                </div>
                                <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-blue-900">
                                  {report.adminMemo}
                                </div>
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
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            total={filtered.length}
            page={page}
            pageSize={20}
            onChange={(p) => {
              setPage(p);
            }}
          />

          <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
            처리와 기각 버튼은 실제 관리자 신고 상태 API를 호출합니다.
          </div>
        </div>
      </div>
    </>
  );
}
