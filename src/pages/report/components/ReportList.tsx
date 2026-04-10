import { useEffect, useState } from 'react';
import {
  fetchMyReports,
  type ReportItem,
  type ReportStatus,
} from '../../../apis/report';

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

const getTargetTypeLabel = (targetType: ReportItem['target_type']) => {
  switch (targetType) {
    case 'USER':
      return '사용자';
    case 'PARTY':
      return '파티';
    case 'CHAT':
      return '채팅';
    default:
      return targetType;
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

export default function ReportList() {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [reports, setReports] = useState<ReportItem[]>([]);
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
  }, [filter]);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-7">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">내 신고 목록</h2>
          <p className="mt-1 text-sm text-gray-500">
            최근 신고 내역과 현재 처리 상태를 확인할 수 있습니다.
          </p>
        </div>

        <div className="rounded-2xl bg-gray-100 p-1">
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
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
            <table className="w-full min-w-160 border-collapse text-left">
              <thead className="bg-gray-50">
                <tr className="text-sm text-gray-500">
                  <th className="px-5 py-4 font-semibold">유형</th>
                  <th className="px-5 py-4 font-semibold">대상</th>
                  <th className="px-5 py-4 font-semibold">사유</th>
                  <th className="px-5 py-4 text-center font-semibold">상태</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-t border-gray-100 text-sm transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {getTargetTypeLabel(report.target_type)}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {report.target_snapshot_name ?? report.target_id}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {getCategoryLabel(report.category)}
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
  );
}
