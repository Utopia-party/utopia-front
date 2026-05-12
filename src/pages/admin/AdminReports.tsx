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

const ADMIN_REPORT_COUNT_CHANGED_EVENT = 'admin-report-count-changed';

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
    <div className="overflow-hidden rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex h-36 md:h-44 items-center justify-center bg-slate-100">
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
            <span className="rounded-lg md:rounded-xl bg-red-50 px-2.5 py-1.5 md:px-3 md:py-2 text-[11px] md:text-xs font-bold text-red-600">
              PDF
            </span>
            <span className="px-4 text-[11px] md:text-xs font-semibold text-slate-600">
              새 탭에서 파일 열기
            </span>
          </a>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="rounded-lg md:rounded-xl bg-slate-200 px-2.5 py-1.5 md:px-3 md:py-2 text-[11px] md:text-xs font-bold text-slate-500">
              NO URL
            </span>
            <span className="text-[10px] md:text-xs text-slate-400">
              조회 URL이 없습니다.
            </span>
          </div>
        )}
      </div>

      <div className="px-3 py-2.5 md:px-4 md:py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="truncate text-xs md:text-sm font-bold text-slate-800">
            {evidence.originalFilename ?? '첨부 파일'}
          </p>
          <span className="shrink-0 text-[10px] md:text-xs font-semibold text-slate-400">
            {formatFileSize(evidence.fileSize)}
          </span>
        </div>
        <div className="mt-1.5 md:mt-2 flex flex-wrap gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-400">
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
  const [isGuideOpen, setIsGuideOpen] = useState(true);
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
    const currentReport = reports.find((report) => report.id === reportId);

    const wasUnhandled =
      currentReport?.status === '접수' || currentReport?.status === '검토중';

    const willBeHandled = status === '처리' || status === '기각';

    try {
      setBusyReportId(reportId);

      await updateAdminReportStatus(reportId, status);

      if (wasUnhandled && willBeHandled) {
        window.dispatchEvent(
          new CustomEvent(ADMIN_REPORT_COUNT_CHANGED_EVENT, {
            detail: { delta: -1 },
          }),
        );
      }

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
    <div className="flex w-full min-w-0 flex-1 flex-col">
      <AdminHeader
        placeholder="신고 검색 (대상/사유/상태)..."
        onSearch={setSearch}
      />

      <div className="flex-1 bg-[#f5f5f5] p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
          <section>
            <h1 className="mb-1 text-xl sm:text-2xl font-bold text-gray-900 break-keep">
              신고 관리
            </h1>
            <p className="mb-4 text-xs sm:text-sm text-gray-500 leading-relaxed break-keep">
              신고 접수 시각, 대상, 사유, 처리 상태와 증빙 자료를 한 화면에서
              확인하고 운영 조치까지 바로 연결할 수 있게 구성했습니다.
            </p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end rounded-xl md:rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <label className="flex w-full sm:w-auto flex-col gap-1.5">
              <span className="text-[11px] md:text-xs font-medium text-gray-500">
                키워드
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="대상 이름 / 사유 / 상태"
                className="w-full sm:w-52 rounded-lg md:rounded-xl border border-gray-200 px-3.5 py-2 md:py-2.5 text-sm outline-none transition focus:border-blue-400"
              />
            </label>

            <div className="flex w-full sm:w-auto gap-2">
              <label className="flex flex-1 sm:flex-none flex-col gap-1.5">
                <span className="text-[11px] md:text-xs font-medium text-gray-500">
                  시작일
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-lg md:rounded-xl border border-gray-200 px-3 py-2 md:py-2.5 text-xs md:text-sm outline-none transition focus:border-blue-400"
                />
              </label>
              <label className="flex flex-1 sm:flex-none flex-col gap-1.5">
                <span className="text-[11px] md:text-xs font-medium text-gray-500">
                  종료일
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-lg md:rounded-xl border border-gray-200 px-3 py-2 md:py-2.5 text-xs md:text-sm outline-none transition focus:border-blue-400"
                />
              </label>
            </div>

            <div className="mt-1 flex w-full sm:w-auto gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={handleSearch}
                className="flex-1 sm:flex-none rounded-lg md:rounded-xl bg-blue-600 px-4 py-2.5 text-xs md:text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
              >
                조회
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 sm:flex-none rounded-lg md:rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs md:text-sm font-medium text-gray-600 transition hover:bg-gray-50 active:scale-95"
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

          <section className="rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm">
            <button
              type="button"
              onClick={() => setIsGuideOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <div className="text-[11px] md:text-xs font-semibold text-slate-500">
                  신고관리 메뉴얼
                </div>
              </div>
              <span className="shrink-0 text-xs font-bold text-slate-500">
                {isGuideOpen ? '접기' : '펼치기'}
              </span>
            </button>

            {isGuideOpen && (
              <div className="mt-3 space-y-3 text-[11px] md:text-xs text-slate-600">
                <div className="rounded-xl border border-white bg-white px-4 py-4">
                  <div className="text-sm font-bold text-slate-900">
                    신고관리 메뉴얼
                  </div>
                  <p className="mt-2 leading-relaxed">
                    신고관리 페이지는 접수된 신고의 대상, 사유, 첨부 자료, 처리
                    상태를 한 번에 확인하고 바로 조치를 진행하는 운영
                    화면입니다. 목록에서 대상을 찾은 뒤 `상세` 버튼을 열어 신고
                    맥락과 증빙을 검토하고, 필요하면 즉시 `처리` 또는 `기각`으로
                    상태를 반영할 수 있습니다.
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-white bg-white px-4 py-4">
                    <div className="font-bold text-slate-800">
                      이 페이지에서 할 수 있는 기능
                    </div>
                    <div className="mt-2 space-y-2 leading-relaxed">
                      <p>
                        1. 키워드, 기간, 상태 탭으로 신고 대상을 빠르게 조회하고
                        필요한 건만 추려서 볼 수 있습니다.
                      </p>
                      <p>
                        2. 신고 대상이 사용자, 파티, 채팅 중 무엇인지 구분해
                        확인하고 운영자가 읽기 쉬운 이름 기준으로 대상을 파악할
                        수 있습니다.
                      </p>
                      <p>
                        3. 첨부된 이미지나 파일을 바로 열어 증빙 자료를 검토할
                        수 있습니다.
                      </p>
                      <p>
                        4. 신고 상태를 `처리` 또는 `기각`으로 변경하고 결과를
                        즉시 반영할 수 있습니다.
                      </p>
                      <p>
                        5. 신고 처리 결과, 검토 시각, 관리자 메모까지 상세
                        패널에서 함께 확인할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white bg-white px-4 py-4">
                    <div className="font-bold text-slate-800">사용 방법</div>
                    <div className="mt-2 space-y-2 leading-relaxed">
                      <p>
                        1. 상단 검색창과 기간 필터로 신고 목록을 먼저 좁힌 뒤
                        상태 탭으로 접수 건과 처리 완료 건을 구분합니다.
                      </p>
                      <p>
                        2. 목록의 `상세` 버튼을 눌러 신고 내용, 신고자, 대상,
                        증빙 자료를 확인합니다.
                      </p>
                      <p>
                        3. 증빙과 사유가 충분하면 `처리`, 근거가 부족하거나
                        오신고라면 `기각`으로 상태를 반영합니다.
                      </p>
                      <p>
                        4. 처리 후에는 상태, 검토일, 처리 결과가 정상적으로
                        바뀌었는지 다시 확인합니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-4">
                  <div className="font-bold text-slate-800">운영 시 참고</div>
                  <div className="mt-2 space-y-1.5 leading-relaxed text-slate-600">
                    <p>
                      처리 버튼은 실제 신고 처리 API를 호출하므로, 상태 변경 전
                      증빙 자료와 신고 내용을 꼭 먼저 확인하는 것이 좋습니다.
                    </p>
                    <p>
                      사용자 신고는 처리 결과에 따라 신뢰도나 이용 상태에 영향이
                      갈 수 있으므로, 대상과 사유를 한 번 더 확인하고 진행하는
                      것이 안전합니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {loading && (
            <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white px-4 py-3 md:px-5 md:py-4 text-xs md:text-sm text-gray-500 shadow-sm">
              신고 목록을 불러오는 중입니다.
            </div>
          )}

          {error && (
            <div className="rounded-xl md:rounded-2xl border border-red-200 bg-red-50 px-4 py-3 md:px-5 md:py-4 text-xs md:text-sm text-red-600 shadow-sm">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              <table className="min-w-200 w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      접수 시각
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      유형
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      대상
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      사유
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      상태
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      첨부
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      내용
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
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
                          <td className="whitespace-nowrap px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-500">
                            {formatDateTime(report.createdAt)}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm whitespace-nowrap">
                            {report.type}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-xs md:text-sm">
                            <div className="max-w-30 md:max-w-none truncate font-bold text-slate-900">
                              {report.target}
                            </div>
                            {report.targetId && (
                              <div className="mt-1 text-[10px] md:text-xs text-slate-400">
                                {report.targetId}
                              </div>
                            )}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm truncate max-w-30 md:max-w-none">
                            {report.reason}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-sm whitespace-nowrap">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-bold ${
                                STATUS_STYLE[report.status] ?? ''
                              }`}
                            >
                              {report.status}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-sm whitespace-nowrap">
                            {report.evidences.length > 0 ? (
                              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-bold text-slate-600">
                                {report.evidences.length}개
                              </span>
                            ) : (
                              <span className="text-[10px] md:text-xs text-slate-400">
                                없음
                              </span>
                            )}
                          </td>
                          <td className="max-w-37.5 md:max-w-xs truncate px-3 md:px-4 py-3.5 text-[11px] md:text-sm">
                            {report.content}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-sm whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                className={`rounded-lg border px-2.5 py-1.5 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold transition active:scale-95 ${
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
                                    className="cursor-pointer rounded-lg border border-blue-400 bg-blue-500 px-2.5 py-1.5 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold text-white transition hover:bg-blue-600 disabled:opacity-60 active:scale-95"
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
                                    className="cursor-pointer rounded-lg border border-red-300 bg-white px-2.5 py-1.5 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-60 active:scale-95"
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
                            <td colSpan={8} className="p-3 md:px-4 md:py-4">
                              <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                                <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <h3 className="text-sm md:text-base font-bold text-slate-900">
                                      신고 상세
                                    </h3>
                                    <p className="mt-1 text-[11px] md:text-sm text-slate-500 break-keep">
                                      신고 내용, 접수 맥락, 증빙 파일을 확인하고
                                      바로 처리합니다.
                                    </p>
                                  </div>
                                  <span
                                    className={`inline-block self-start lg:self-auto rounded-full px-2.5 py-1 text-[10px] md:text-xs font-bold ${
                                      STATUS_STYLE[report.status] ?? ''
                                    }`}
                                  >
                                    {report.status}
                                  </span>
                                </div>

                                <div className="mt-4 md:mt-5 grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
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
                                    [
                                      '접수일',
                                      formatDateTime(report.createdAt),
                                    ],
                                    [
                                      '검토일',
                                      formatDateTime(report.reviewedAt),
                                    ],
                                    [
                                      '처리 결과',
                                      getActionResultLabel(
                                        report.actionResultCode,
                                      ),
                                    ],
                                  ].map(([label, value]) => (
                                    <div
                                      key={label}
                                      className="rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:px-4 md:py-3"
                                    >
                                      <div className="text-[10px] md:text-xs font-medium text-slate-400">
                                        {label}
                                      </div>
                                      <div className="mt-1 break-all text-xs md:text-sm font-bold text-slate-800">
                                        {value}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-4 md:mt-5 rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4">
                                  <div className="text-[10px] md:text-xs font-medium text-slate-400">
                                    신고 내용
                                  </div>
                                  <div className="mt-1.5 md:mt-2 whitespace-pre-wrap wrap-break-word text-xs md:text-sm leading-relaxed text-slate-800">
                                    {report.content || '-'}
                                  </div>
                                </div>

                                <div className="mt-4 md:mt-5 rounded-lg md:rounded-xl border border-slate-200 bg-white p-3 md:p-4">
                                  <div className="mb-2.5 md:mb-3 flex items-center justify-between gap-3">
                                    <h4 className="text-xs md:text-sm font-bold text-slate-900">
                                      증빙 파일
                                    </h4>
                                    <span className="text-[10px] md:text-xs font-semibold text-slate-400">
                                      {report.evidences.length}개
                                    </span>
                                  </div>

                                  {report.evidences.length === 0 ? (
                                    <div className="rounded-lg md:rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 md:py-8 text-center text-[11px] md:text-sm text-slate-400">
                                      첨부된 증빙 파일이 없습니다.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                                  <div className="mt-4 md:mt-5 rounded-lg md:rounded-xl border border-blue-100 bg-blue-50 p-3 md:p-4">
                                    <div className="text-[10px] md:text-xs font-bold text-blue-500">
                                      관리자 메모
                                    </div>
                                    <div className="mt-1.5 md:mt-2 whitespace-pre-wrap wrap-break-word text-xs md:text-sm leading-relaxed text-blue-900">
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
                      <td
                        colSpan={8}
                        className="py-10 md:py-16 text-center text-xs md:text-sm text-gray-400"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 md:px-5 md:py-4">
              <Pagination
                total={filtered.length}
                page={page}
                pageSize={20}
                onChange={(p) => {
                  setPage(p);
                }}
              />
            </div>

            <div className="border-t border-gray-100 bg-slate-50/50 px-4 py-3 text-[10px] md:text-xs text-gray-400 break-keep">
              처리와 기각 버튼은 실제 관리자 신고 상태 API를 호출합니다.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
