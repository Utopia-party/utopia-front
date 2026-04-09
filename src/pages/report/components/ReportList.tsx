import { useState } from 'react';
import type { FilterType, ReportItem } from '../../../types/report.ts';

const MOCK_REPORTS: ReportItem[] = [
  {
    id: 1,
    type: '사용자',
    target: 'user_02',
    reason: '욕설/비방',
    status: '접수',
  },
  {
    id: 2,
    type: '파티',
    target: 'party_101',
    reason: '사기/불이행',
    status: '처리',
  },
  {
    id: 3,
    type: '채팅',
    target: 'chatroom_88',
    reason: '스팸/도배',
    status: '기각',
  },
];

const FILTERS: FilterType[] = ['전체', '접수', '처리', '기각'];

const getStatusClassName = (status: ReportItem['status']) => {
  switch (status) {
    case '접수':
      return 'bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-200';
    case '처리':
      return 'bg-green-50 text-green-600 ring-1 ring-inset ring-green-200';
    case '기각':
      return 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export default function ReportList() {
  const [filter, setFilter] = useState<FilterType>('전체');

  const filteredReports = MOCK_REPORTS.filter((report) =>
    filter === '전체' ? true : report.status === filter,
  );

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
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  filter === f
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredReports.length === 0 ? (
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
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-t border-gray-100 text-sm transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {report.type}
                    </td>
                    <td className="px-5 py-4 text-gray-700">{report.target}</td>
                    <td className="px-5 py-4 text-gray-700">{report.reason}</td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(
                          report.status,
                        )}`}
                      >
                        {report.status}
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
