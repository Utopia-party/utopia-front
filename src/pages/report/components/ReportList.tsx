import { useEffect, useState } from 'react';
import {
  fetchMyReports,
  type ReportItem,
  type ReportStatus,
} from '../../../apis/report';

interface ReportListProps {
  refreshKey?: number;
}

type FilterType = 'ALL' | ReportStatus;

const FILTERS: { label: string; value: FilterType }[] = [
  { label: '전체', value: 'ALL' },
  { label: '접수', value: 'PENDING' },
  { label: '검토중', value: 'IN_REVIEW' },
  { label: '처리', value: 'APPROVED' },
  { label: '기각', value: 'REJECTED' },
];

const getStatusLabel = (status: ReportStatus) => {
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
      return status;
  }
};

const getCategoryLabel = (category: ReportItem['category']) => {
  switch (category) {
    case 'PROFANITY':
      return '욕설/비방';
    case 'SCAM':
      return '사기/불이행';
    case 'SPAM':
      return '스팸/도배';
    default:
      return category;
  }
};

const getActionResultLabel = (code: string) => {
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
      return code;
  }
};

const getStatusClassName = (status: ReportStatus) => {
  switch (status) {
    case 'PENDING':
      return 'bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-200';
    case 'IN_REVIEW':
      return 'bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200';
    case 'APPROVED':
      return 'bg-green-50 text-green-600 ring-1 ring-inset ring-green-200';
    case 'REJECTED':
      return 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '-';

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

function ReportDetailModal({
  report,
  onClose,
}: {
  report: ReportItem;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 bg-slate-900 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Report Detail
            </p>
            <h3 className="mt-1 text-lg font-extrabold text-white">
              신고 상세 정보
            </h3>
            <p className="mt-1 text-xs text-slate-400">신고 ID: {report.id}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xl font-light text-slate-400 transition hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-6">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(
                report.status,
              )}`}
            >
              {getStatusLabel(report.status)}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
              {getCategoryLabel(report.category)}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-500">신고 대상</p>
              <p className="mt-1 break-all text-sm font-bold text-gray-900">
                {report.target_snapshot_name ?? report.target_id}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-500">대상 타입</p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                {report.target_type}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-500">신고일</p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                {formatDateTime(report.created_at)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-500">최종 수정일</p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                {formatDateTime(report.updated_at)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-500">검토일</p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                {formatDateTime(report.reviewed_at)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-500">처리 결과</p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                {getActionResultLabel(report.action_result_code)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm font-bold text-gray-900">상세 내용</p>
            <p className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700">
              {report.description}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-gray-900">첨부 파일</p>
              <span className="text-xs font-semibold text-gray-400">
                {report.evidences.length}개
              </span>
            </div>

            {report.evidences.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                첨부된 증빙 파일이 없습니다.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {report.evidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <p className="truncate text-sm font-bold text-gray-800">
                        {evidence.original_filename ?? '첨부 파일'}
                      </p>
                      <span className="shrink-0 text-xs font-semibold text-gray-400">
                        {formatFileSize(evidence.file_size)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                      <span>{evidence.content_type ?? 'unknown'}</span>
                      <span>·</span>
                      <span>{formatDateTime(evidence.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {report.admin_memo && (
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-bold text-blue-900">관리자 메모</p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-blue-800">
                {report.admin_memo}
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportList({ refreshKey = 0 }: ReportListProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async (nextFilter: FilterType) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchMyReports(
        nextFilter === 'ALL' ? undefined : nextFilter,
      );

      setReports(data);
    } catch (err) {
      console.error(err);
      setError('신고 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReports(filter);
  }, [filter, refreshKey]);

  return (
    <>
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-7">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">내 신고 목록</h2>
            <p className="mt-1 text-sm text-gray-500">
              최근 사용자 신고 내역과 현재 처리 상태를 확인할 수 있습니다.
            </p>
          </div>

          <div className="rounded-2xl bg-gray-100 p-1">
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    filter === f.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-60 items-center justify-center text-sm text-gray-500">
            불러오는 중...
          </div>
        ) : error ? (
          <div className="flex min-h-60 items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 text-sm text-red-600">
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center">
            <p className="text-sm font-semibold text-gray-700">
              표시할 신고 내역이 없습니다.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              새로운 신고를 등록하면 이곳에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-180 border-collapse text-left">
                <thead className="bg-gray-50">
                  <tr className="text-sm text-gray-500">
                    <th className="px-5 py-4 font-semibold">신고 대상</th>
                    <th className="px-5 py-4 font-semibold">사유</th>
                    <th className="px-5 py-4 font-semibold">첨부</th>
                    <th className="px-5 py-4 font-semibold">신고일</th>
                    <th className="px-5 py-4 text-center font-semibold">
                      상태
                    </th>
                    <th className="px-5 py-4 text-center font-semibold">
                      상세
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="cursor-pointer border-t border-gray-100 text-sm transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-medium text-gray-800">
                        {report.target_snapshot_name ?? report.target_id}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {getCategoryLabel(report.category)}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {report.evidences.length > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                            {report.evidences.length}개
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">없음</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {new Date(report.created_at).toLocaleDateString(
                          'ko-KR',
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(
                            report.status,
                          )}`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report);
                          }}
                          className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
          처리 또는 기각 상태 변경은 관리자 검토 후 반영됩니다.
        </div>
      </section>

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </>
  );
}
