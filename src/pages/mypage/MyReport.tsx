import { useEffect, useMemo, useState } from 'react';
import {
  fetchMyReports,
  type ReportCategory as ApiReportCategory,
  type ReportItem as ApiReportItem,
  type ReportStatus as ApiReportStatus,
} from '../../apis/report';
import type { ReportItem, ReportStatus } from '../../types/report';
import { usePageTitle } from '../../hooks/usePageTitle';

type FilterStatus = 'ALL' | ReportStatus;
type PeriodFilter = '1MONTH' | '3MONTHS' | '6MONTHS' | 'ALL';

const ITEMS_PER_PAGE = 15;

const statusClassMap: Record<ReportStatus, string> = {
  접수: 'border-slate-200 bg-slate-50 text-slate-700',
  검토중: 'border-blue-200 bg-blue-50 text-blue-700',
  처리: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  기각: 'border-rose-200 bg-rose-50 text-rose-700',
};

const categoryLabelMap: Record<ApiReportCategory, string> = {
  PROFANITY: '비매너/욕설',
  SCAM: '사기/금전요구',
  SPAM: '스팸/홍보',
};

const uiToApiStatusMap: Record<ReportStatus, ApiReportStatus> = {
  접수: 'PENDING',
  검토중: 'IN_REVIEW',
  처리: 'APPROVED',
  기각: 'REJECTED',
};

function mapApiStatusToUiStatus(status: ApiReportStatus): ReportStatus {
  switch (status) {
    case 'PENDING':
      return '접수';
    case 'IN_REVIEW':
      return '검토중';
    case 'APPROVED':
      return '처리';
    case 'REJECTED':
      return '기각';
    default:
      return '접수';
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return '-';

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isWithinPeriod(dateString: string, period: PeriodFilter) {
  if (period === 'ALL') return true;

  const baseDate = new Date(dateString);
  if (Number.isNaN(baseDate.getTime())) return false;

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  const reportDay = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    0,
    0,
    0,
    0,
  );

  const start = new Date(today);

  if (period === '1MONTH') {
    start.setMonth(start.getMonth() - 1);
  } else if (period === '3MONTHS') {
    start.setMonth(start.getMonth() - 3);
  } else {
    start.setMonth(start.getMonth() - 6);
  }

  start.setHours(0, 0, 0, 0);

  return reportDay >= start && reportDay <= today;
}

function mapApiReportToUiReport(report: ApiReportItem): ReportItem {
  return {
    id: report.id,
    type: 'USER',
    target: report.target_snapshot_name || '알 수 없는 사용자',
    reason: categoryLabelMap[report.category] ?? report.category,
    description: report.description,
    status: mapApiStatusToUiStatus(report.status),
    createdAt: report.created_at,
    targetId: report.target_id,
  };
}

export default function MyReport() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('1MONTH');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  usePageTitle('신고 내역');

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError(null);

        const data =
          statusFilter === 'ALL'
            ? await fetchMyReports()
            : await fetchMyReports(uiToApiStatusMap[statusFilter]);

        if (!isMounted) return;

        setReports(data.map(mapApiReportToUiReport));
      } catch (err) {
        console.error('신고 내역 조회 실패:', err);

        if (!isMounted) return;
        setError('신고 내역을 불러오지 못했습니다.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

  const filteredReports = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesPeriod = isWithinPeriod(report.createdAt, periodFilter);

      const matchesKeyword =
        keyword.length === 0 ||
        report.id.toLowerCase().includes(keyword) ||
        report.target.toLowerCase().includes(keyword) ||
        report.reason.toLowerCase().includes(keyword) ||
        report.description.toLowerCase().includes(keyword);

      return matchesPeriod && matchesKeyword;
    });
  }, [reports, periodFilter, searchKeyword]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / ITEMS_PER_PAGE),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedReports = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReports, safeCurrentPage]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
            마이페이지 - 신고내역
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">내 신고내역</p>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as FilterStatus);
                    setCurrentPage(1);
                  }}
                  className="h-11 min-w-[132px] appearance-none rounded-full border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-white focus:border-primary focus:bg-white"
                >
                  <option value="ALL">전체 상태</option>
                  <option value="접수">접수</option>
                  <option value="검토중">검토중</option>
                  <option value="처리">처리완료</option>
                  <option value="기각">기각</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>

              <div className="relative">
                <select
                  value={periodFilter}
                  onChange={(e) => {
                    setPeriodFilter(e.target.value as PeriodFilter);
                    setCurrentPage(1);
                  }}
                  className="h-11 min-w-[132px] appearance-none rounded-full border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-white focus:border-primary focus:bg-white"
                >
                  <option value="1MONTH">최근 1개월</option>
                  <option value="3MONTHS">최근 3개월</option>
                  <option value="6MONTHS">최근 6개월</option>
                  <option value="ALL">전체 기간</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div className="w-full xl:max-w-[260px]">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="대상명/신고ID 검색"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/30">
            <div className="hidden grid-cols-[1.2fr_2fr_2fr_1.2fr_1.8fr] items-center border-b border-slate-200 bg-slate-50 px-10 py-4 text-base font-extrabold text-slate-500 md:grid">
              <span>날짜</span>
              <span>신고 대상</span>
              <span>사유</span>
              <span>상태</span>
              <span>신고 ID</span>
            </div>

            <div className="bg-white">
              {loading ? (
                <div className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
                  신고 내역을 불러오는 중입니다...
                </div>
              ) : error ? (
                <div className="px-6 py-16 text-center text-sm font-semibold text-rose-500">
                  {error}
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
                  표시할 신고 내역이 없습니다.
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-200">
                    {pagedReports.map((report) => {
                      const statusClass = statusClassMap[report.status];

                      return (
                        <article
                          key={report.id}
                          className="grid gap-4 px-5 py-5 md:grid-cols-[1.2fr_2fr_2fr_1.2fr_1.8fr] md:items-center md:px-10"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-400 md:hidden">
                              날짜
                            </p>
                            <p className="text-[15px] font-bold text-slate-500">
                              {formatDate(report.createdAt)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-400 md:hidden">
                              신고 대상
                            </p>
                            <p className="text-[17px] font-extrabold text-slate-900">
                              {report.target}
                            </p>
                            <p className="mt-1 text-[15px] font-bold text-slate-500">
                              대상 ID: {report.targetId}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-400 md:hidden">
                              사유
                            </p>
                            <p className="text-[17px] font-extrabold text-slate-900">
                              {report.reason}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[14px] font-medium text-slate-500">
                              {report.description}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-400 md:hidden">
                              상태
                            </p>
                            <span
                              className={`inline-flex rounded-full border px-4 py-2 text-sm font-extrabold ${statusClass}`}
                            >
                              {report.status}
                            </span>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-400 md:hidden">
                              신고 ID
                            </p>
                            <p className="break-all text-[15px] font-bold text-slate-500">
                              {report.id}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-200 bg-white px-5 py-5 md:px-10">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() =>
                          setCurrentPage(Math.max(safeCurrentPage - 1, 1))
                        }
                        disabled={safeCurrentPage === 1}
                      >
                        이전
                      </button>

                      {pageNumbers.map((page) => (
                        <button
                          key={page}
                          type="button"
                          className={[
                            'h-11 min-w-[44px] rounded-full px-4 text-sm font-extrabold transition',
                            safeCurrentPage === page
                              ? 'bg-primary text-white'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                          ].join(' ')}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() =>
                          setCurrentPage(
                            Math.min(safeCurrentPage + 1, totalPages),
                          )
                        }
                        disabled={safeCurrentPage === totalPages}
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
