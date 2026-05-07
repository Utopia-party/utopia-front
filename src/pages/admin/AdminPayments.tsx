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

function getCommissionLabel(payment: AdminPaymentRecord) {
  if (
    payment.pricingType === 'quick_match' &&
    (payment.quickMatchFeeRate ?? 0) > 0
  ) {
    return `(빠른매칭 +${Math.round(payment.quickMatchFeeRate * 100)}%)`;
  }
  return `(${Math.round(payment.commissionRate * 100)}%)`;
}

function getDiscountBadges(payment: AdminPaymentRecord) {
  const badges: Array<{ label: string; className: string }> = [];

  if (payment.discountReason) {
    badges.push({
      label: payment.discountReason,
      className: 'border-sky-200 bg-sky-50 text-sky-700',
    });
  }

  if (
    payment.pricingType === 'quick_match' &&
    (payment.quickMatchFeeRate ?? 0) > 0
  ) {
    badges.push({
      label: `빠른매칭 수수료 ${Math.round(payment.quickMatchFeeRate * 100)}%`,
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    });
  }

  return badges;
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
    const timer = setInterval(() => {
      void load({ page: 1 });
    }, 60_000);
    return () => clearInterval(timer);
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
    // 💡 최상위 레이아웃 강제 붕괴 방지
    <div className="flex w-full min-w-0 flex-1 flex-col">
      <AdminHeader placeholder="결제 검색 (닉네임/파티명/서비스명)..." />

      {/* 💡 전반적인 패딩 최적화 */}
      <div className="flex-1 bg-[#f5f5f5] p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
          <section>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-keep">
              수익내역 관리
            </h1>
            <p className="mt-1 text-xs md:text-sm text-gray-500 break-keep">
              결제 내역, 할인이 적용된 실결제 금액, 수수료 수익을 조회합니다.
            </p>
          </section>

          {/* 💡 검색 폼 영역 모바일 최적화 (flex-col 기반 유연한 배치) */}
          <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="flex w-full sm:w-auto flex-col gap-1.5">
                <span className="text-[11px] md:text-xs font-medium text-gray-500">
                  키워드
                </span>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="닉네임, 파티명, 서비스명"
                  className="w-full sm:w-48 rounded-lg md:rounded-xl border border-gray-200 px-3.5 py-2.5 md:py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </label>

              <label className="flex w-full sm:w-auto flex-col gap-1.5">
                <span className="text-[11px] md:text-xs font-medium text-gray-500">
                  상태
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto rounded-lg md:rounded-xl border border-gray-200 px-3.5 py-2.5 md:py-2 text-sm outline-none transition focus:border-blue-400 bg-white"
                >
                  <option value="">전체</option>
                  <option value="approved">승인</option>
                  <option value="pending">대기</option>
                  <option value="rejected">거절</option>
                </select>
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
                    className="w-full rounded-lg md:rounded-xl border border-gray-200 px-3 py-2.5 md:py-2 text-[11px] md:text-sm outline-none transition focus:border-blue-400"
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
                    className="w-full rounded-lg md:rounded-xl border border-gray-200 px-3 py-2.5 md:py-2 text-[11px] md:text-sm outline-none transition focus:border-blue-400"
                  />
                </label>
              </div>

              <div className="mt-1 flex w-full sm:w-auto gap-2 sm:ml-auto">
                <button
                  onClick={handleSearch}
                  className="flex-1 sm:flex-none rounded-lg md:rounded-xl bg-blue-600 px-4 py-2.5 text-xs md:text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95"
                >
                  조회
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 sm:flex-none rounded-lg md:rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs md:text-sm font-bold text-gray-600 transition hover:bg-gray-50 active:scale-95"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>

          {/* 💡 요약 카드: 모바일 3단, 작아지면 1/2단 등 자유롭게 배치되도록 설정 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white p-3.5 md:p-4 shadow-sm col-span-2 md:col-span-1">
              <p className="text-[11px] md:text-xs font-medium text-gray-500">
                전체 건수
              </p>
              <p className="mt-1 text-xl md:text-2xl font-bold text-gray-900">
                {total.toLocaleString()}건
              </p>
            </div>
            <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white p-3.5 md:p-4 shadow-sm">
              <p className="text-[11px] md:text-xs font-medium text-gray-500">
                매출 합계
              </p>
              <p className="mt-1 text-xl md:text-2xl font-bold text-blue-600">
                {fmt(revenueTotal)}
              </p>
            </div>
            <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white p-3.5 md:p-4 shadow-sm">
              <p className="text-[11px] md:text-xs font-medium text-gray-500">
                수수료 합계
              </p>
              <p className="mt-1 text-xl md:text-2xl font-bold text-orange-500">
                {fmt(commissionTotal)}
              </p>
            </div>
          </div>

          {/* 💡 테이블 가로 스크롤 허용 */}
          <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-12 md:py-16 text-center text-xs md:text-sm font-bold text-gray-400">
                불러오는 중...
              </div>
            ) : error ? (
              <div className="py-12 md:py-16 text-center text-xs md:text-sm font-bold text-rose-500">
                {error}
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 md:py-16 text-center text-xs md:text-sm font-bold text-gray-400">
                결제 내역이 없습니다.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                  <table className="min-w-max w-full text-xs md:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-left font-semibold text-gray-500">
                        <th className="px-3 md:px-4 py-3 whitespace-nowrap">
                          사용자
                        </th>
                        <th className="px-3 md:px-4 py-3 whitespace-nowrap">
                          파티 / 서비스
                        </th>
                        <th className="px-3 md:px-4 py-3 whitespace-nowrap">
                          역할
                        </th>
                        <th className="px-3 md:px-4 py-3 whitespace-nowrap">
                          결제 방법
                        </th>
                        <th className="px-3 md:px-4 py-3 whitespace-nowrap">
                          청구월
                        </th>
                        <th className="px-3 md:px-4 py-3 text-right whitespace-nowrap">
                          1인 기준
                        </th>
                        <th className="px-3 md:px-4 py-3 text-right whitespace-nowrap">
                          실결제
                        </th>
                        <th className="px-3 md:px-4 py-3 whitespace-nowrap">
                          할인
                        </th>
                        <th className="px-3 md:px-4 py-3 text-right whitespace-nowrap">
                          수수료
                        </th>
                        <th className="px-3 md:px-4 py-3 whitespace-nowrap">
                          상태
                        </th>
                        <th className="px-3 md:px-4 py-3 whitespace-nowrap">
                          결제일
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {payments.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 md:px-4 py-3">
                            <p className="font-bold text-gray-900 break-keep">
                              {p.userNickname}
                            </p>
                            {p.userName && (
                              <p className="mt-0.5 text-[10px] md:text-xs text-gray-400 truncate max-w-20">
                                {p.userName}
                              </p>
                            )}
                          </td>
                          <td className="px-3 md:px-4 py-3">
                            <p className="font-bold text-gray-900 max-w-30 md:max-w-40 truncate">
                              {p.partyTitle}
                            </p>
                            {p.serviceName && (
                              <p className="mt-0.5 text-[10px] md:text-xs text-gray-400">
                                {p.serviceName}
                              </p>
                            )}
                          </td>
                          <td className="px-3 md:px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-bold border ${
                                p.role === '방장'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-gray-50 text-gray-600 border-gray-200'
                              }`}
                            >
                              {p.role}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {METHOD_LABEL[p.paymentMethod ?? ''] ??
                              p.paymentMethod ??
                              '-'}
                          </td>
                          <td className="px-3 md:px-4 py-3 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {p.billingMonth}
                          </td>
                          <td className="px-3 md:px-4 py-3 text-right text-[11px] md:text-sm text-gray-500 whitespace-nowrap">
                            {fmt(p.basePrice)}
                          </td>
                          <td className="px-3 md:px-4 py-3 text-right text-[11px] md:text-sm font-bold text-gray-900 whitespace-nowrap">
                            {fmt(p.amount)}
                          </td>
                          <td className="px-3 md:px-4 py-3">
                            {getDiscountBadges(p).length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {getDiscountBadges(p).map((badge) => (
                                  <span
                                    key={badge.label}
                                    className={`inline-flex rounded-full border px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-medium whitespace-nowrap ${badge.className}`}
                                  >
                                    {badge.label}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] md:text-xs text-gray-300">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-3 md:px-4 py-3 text-right text-[11px] md:text-sm font-bold text-orange-500 whitespace-nowrap">
                            {fmt(p.commissionAmount)}
                            <span className="block md:inline md:ml-1 text-[9px] md:text-[11px] font-normal text-gray-400">
                              {getCommissionLabel(p)}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-bold ${
                                STATUS_CLASS[p.status] ??
                                'bg-gray-50 text-gray-600 border-gray-200'
                              }`}
                            >
                              {STATUS_LABEL[p.status] ?? p.status}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3 text-[10px] md:text-xs text-gray-500 whitespace-nowrap">
                            {fmtDate(p.paidAt ?? p.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 💡 페이지네이션 모바일 대응 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 md:py-4">
                  <p className="text-[11px] md:text-xs font-medium text-gray-400">
                    총 {total.toLocaleString()}건 · {page} / {totalPages} 페이지
                  </p>
                  <div className="flex items-center gap-1 md:gap-1.5">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={page === 1}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 md:px-2.5 md:py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 active:scale-95 transition"
                    >
                      «
                    </button>
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 md:px-2.5 md:py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 active:scale-95 transition"
                    >
                      ‹
                    </button>
                    {pageRange().map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`rounded-lg px-2.5 py-1 md:px-3 md:py-1.5 text-xs font-bold transition active:scale-95 ${
                          p === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 md:px-2.5 md:py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 active:scale-95 transition"
                    >
                      ›
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={page === totalPages}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 md:px-2.5 md:py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 active:scale-95 transition"
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
    </div>
  );
}
