import { useCallback, useEffect, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import {
  fetchAdminPayments,
  getAdminErrorMessage,
  type AdminPaymentRecord,
} from '../../apis/admin';

const STATUS_LABEL: Record<string, string> = {
  approved: '승인',
  pending: '대기',
  rejected: '거절',
};

const STATUS_CLASS: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const METHOD_LABEL: Record<string, string> = {
  card: '카드',
  transfer: '계좌이체',
};

const PAGE_SIZE = 20;

function fmt(n: number | undefined) {
  if (n === undefined || n === null) return '-';
  return `₩ ${n.toLocaleString()}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // 검색 파라미터 (실제 조회에 쓰이는 값 — 조회 버튼 눌렀을 때만 반영)
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  const load = useCallback(
    async (params: {
      keyword?: string;
      status?: string;
      date_from?: string;
      date_to?: string;
      page: number;
    }) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchAdminPayments({
          keyword: params.keyword || undefined,
          status: params.status || undefined,
          date_from: params.date_from || undefined,
          date_to: params.date_to || undefined,
          page: params.page,
          limit: PAGE_SIZE,
        });
        setPayments(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        setError(getAdminErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load({ page: 1 });
  }, [load]);

  const handleSearch = () => {
    setAppliedKeyword(keyword);
    setAppliedStatus(statusFilter);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setPage(1);
    void load({
      keyword,
      status: statusFilter,
      date_from: dateFrom,
      date_to: dateTo,
      page: 1,
    });
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setAppliedKeyword('');
    setAppliedStatus('');
    setAppliedDateFrom('');
    setAppliedDateTo('');
    setPage(1);
    void load({ page: 1 });
  };

  const handlePageChange = (next: number) => {
    setPage(next);
    void load({
      keyword: appliedKeyword,
      status: appliedStatus,
      date_from: appliedDateFrom,
      date_to: appliedDateTo,
      page: next,
    });
  };

  // 승인된 결제만 매출/수수료 합계에 반영한다.
  const approvedItems = payments.filter((p) => p.status === 'approved');
  const revenueTotal = approvedItems.reduce((s, p) => s + (p.amount ?? 0), 0);
  const commissionTotal = approvedItems.reduce(
    (s, p) => s + (p.commissionAmount ?? 0),
    0,
  );

  // 페이지 번호 범위
  const pageRange = () => {
    const delta = 2;
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    const range: number[] = [];
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <AdminHeader placeholder="결제 검색 (닉네임/파티명/서비스명)..." />

      <div className="p-6 space-y-4">
        {/* 검색 필터 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                키워드
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="닉네임, 파티명, 서비스명"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                상태
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              >
                <option value="">전체</option>
                <option value="approved">승인</option>
                <option value="pending">대기</option>
                <option value="rejected">거절</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                시작일
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                종료일
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <button
              onClick={handleSearch}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              조회
            </button>
            <button
              onClick={handleReset}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">전체 건수</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {total.toLocaleString()}건
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">매출 합계</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {fmt(revenueTotal)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">수수료 합계</p>
            <p className="mt-1 text-2xl font-bold text-orange-500">
              {fmt(commissionTotal)}
            </p>
          </div>
        </div>

        {/* 테이블 */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">
              불러오는 중...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-rose-500">
              {error}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              결제 내역이 없습니다.
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                    <th className="px-4 py-3">사용자</th>
                    <th className="px-4 py-3">파티 / 서비스</th>
                    <th className="px-4 py-3">역할</th>
                    <th className="px-4 py-3">결제 방법</th>
                    <th className="px-4 py-3">청구월</th>
                    <th className="px-4 py-3 text-right">1인 기준</th>
                    <th className="px-4 py-3 text-right">실결제</th>
                    <th className="px-4 py-3">할인</th>
                    <th className="px-4 py-3 text-right">수수료</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">결제일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {p.userNickname}
                        </p>
                        {p.userName && (
                          <p className="text-xs text-gray-400">{p.userName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 max-w-[160px] truncate">
                          {p.partyTitle}
                        </p>
                        {p.serviceName && (
                          <p className="text-xs text-gray-400">
                            {p.serviceName}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold border ${
                            p.role === '방장'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {p.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {METHOD_LABEL[p.paymentMethod ?? ''] ??
                          p.paymentMethod ??
                          '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.billingMonth}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {fmt(p.basePrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {fmt(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        {p.discountReason ? (
                          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
                            {p.discountReason}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-orange-500">
                        {fmt(p.commissionAmount)}
                        <span className="ml-1 text-xs font-normal text-gray-400">
                          ({Math.round(p.commissionRate * 100)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            STATUS_CLASS[p.status] ??
                            'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {fmtDate(p.paidAt ?? p.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 페이지네이션 */}
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">
                  총 {total.toLocaleString()}건 · {page} / {totalPages} 페이지
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                    className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    «
                  </button>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    ‹
                  </button>
                  {pageRange().map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        p === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={page === totalPages}
                    className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    »
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
