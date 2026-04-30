import Pagination from '../Pagination';
import type { QuickMatchRequestRow } from '../../../../types/admin/adminQuickMatch.ts';
import {
  labelFailureReason,
  QuickMatchStatusBadge,
} from './QuickMatchStatusBadge';

function formatSeconds(value?: number | null) {
  if (value == null) return '-';
  return `${value.toFixed(2)}초`;
}

function formatOptional(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}

export function QuickMatchRequestTable({
  rows,
  total,
  page,
  pageSize,
  loading,
  selectedRequestId,
  onSelect,
  onPageChange,
}: {
  rows: QuickMatchRequestRow[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  selectedRequestId: string;
  onSelect: (requestId: string) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {[
                '요청 시각',
                '요청 ID',
                '사용자',
                '서비스',
                '상태',
                '선택 파티',
                '실패 사유',
                '소요 시간',
              ].map((head) => (
                <th
                  key={head}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.requestId}
                onClick={() => onSelect(row.requestId)}
                className={`cursor-pointer border-b border-slate-100 transition hover:bg-indigo-50/40 ${selectedRequestId === row.requestId ? 'bg-indigo-50/60' : 'bg-white'}`}
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                  {row.requestedAt}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  {row.requestId}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-semibold text-slate-800">
                    {row.userNickname}
                  </div>
                  <div className="text-xs text-slate-400">{row.userId}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                  {row.serviceName}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <QuickMatchStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {formatOptional(row.matchedPartyName)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {labelFailureReason(row.failReason)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                  {formatSeconds(row.totalMatchSeconds)}
                </td>
              </tr>
            ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-slate-400"
                >
                  조건에 맞는 빠른매칭 요청이 없습니다.
                </td>
              </tr>
            )}

            {loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-slate-400"
                >
                  요청 목록을 불러오는 중입니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <Pagination
          total={total}
          page={page}
          pageSize={pageSize}
          onChange={onPageChange}
        />
      </div>
    </>
  );
}
