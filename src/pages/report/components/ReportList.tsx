import { useState } from 'react';
import type { FilterType, ReportItem } from '../../../types/report.ts';

// 임시 데이터 (나중에 API로 대체)
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

export default function ReportList() {
  const [filter, setFilter] = useState<FilterType>('전체');

  const filteredReports = MOCK_REPORTS.filter((report) =>
    filter === '전체' ? true : report.status === filter,
  );

  return (
    <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-6">내 신고 목록</h2>

      {/* 필터 버튼 */}
      <div className="flex gap-2 mb-6">
        {(['전체', '접수', '처리', '기각'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 신고 목록 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-500 text-sm border-b-2 border-gray-100">
              <th className="py-3 font-medium">유형</th>
              <th className="py-3 font-medium">대상</th>
              <th className="py-3 font-medium">사유</th>
              <th className="py-3 font-medium text-right">상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr
                key={report.id}
                className="border-b border-gray-100 last:border-none text-sm font-medium"
              >
                <td className="py-4 text-gray-800">{report.type}</td>
                <td className="py-4 text-gray-800">{report.target}</td>
                <td className="py-4 text-gray-800">{report.reason}</td>
                <td
                  className={`py-4 text-right font-bold ${
                    report.status === '접수'
                      ? 'text-orange-500'
                      : report.status === '처리'
                        ? 'text-green-500'
                        : 'text-red-500'
                  }`}
                >
                  {report.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        처리/기각은 관리자 페이지에서 진행됩니다.
      </p>
    </div>
  );
}
