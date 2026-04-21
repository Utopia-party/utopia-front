import { useEffect, useMemo, useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { fetchMyPayments } from '../../apis/user';
import type { MyPaymentItem } from '../../types/user';

type PaymentStatus = 'pending' | 'approved' | 'rejected';
type PaymentMethod = 'card' | 'transfer' | null;

type StatusFilter = 'all' | PaymentStatus;
type PeriodFilter = '3months' | '6months' | 'all';

function formatPrice(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`;
}

function formatDate(value: string | null) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('ko-KR');
}

function getDisplayPartyName(item: MyPaymentItem) {
  if (item.party_title && item.party_title.trim()) return item.party_title;
  if (item.party_id) return `파티 (${item.party_id.slice(0, 8)})`;
  return '파티 정보 없음';
}

function getDisplayPaymentId(item: MyPaymentItem) {
  if (item.pg_transaction_id && item.pg_transaction_id.trim()) {
    return item.pg_transaction_id;
  }
  return item.id;
}

function getStatusMeta(status: PaymentStatus | string) {
  switch (status) {
    case 'approved':
      return {
        label: '결제완료',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      };
    case 'pending':
      return {
        label: '입금대기',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
      };
    case 'rejected':
      return {
        label: '결제실패',
        className: 'border-rose-200 bg-rose-50 text-rose-700',
      };
    default:
      return {
        label: status || '알 수 없음',
        className: 'border-slate-200 bg-slate-100 text-slate-600',
      };
  }
}

function getMethodLabel(method: PaymentMethod | string) {
  switch (method) {
    case 'card':
      return '카드';
    case 'transfer':
      return '계좌이체';
    default:
      return '-';
  }
}

function isWithinPeriod(item: MyPaymentItem, period: PeriodFilter) {
  if (period === 'all') return true;

  const baseDate = new Date(item.paid_at ?? item.created_at);
  if (Number.isNaN(baseDate.getTime())) return true;

  const cutoff = new Date();

  if (period === '3months') {
    cutoff.setMonth(cutoff.getMonth() - 3);
  } else {
    cutoff.setMonth(cutoff.getMonth() - 6);
  }

  return baseDate >= cutoff;
}

export default function MyPayment() {
  usePageTitle('결제 내역');

  const [payments, setPayments] = useState<MyPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('3months');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchMyPayments();
        setPayments(Array.isArray(data) ? data : []);
      } catch (err: any) {
        const message =
          err?.response?.data?.detail ||
          err?.message ||
          '결제 내역을 불러오지 못했습니다.';

        setError(message);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return payments.filter((item) => {
      const matchesStatus =
        statusFilter === 'all' ? true : item.status === statusFilter;

      const matchesPeriod = isWithinPeriod(item, periodFilter);

      const partyName = getDisplayPartyName(item).toLowerCase();
      const paymentId = getDisplayPaymentId(item).toLowerCase();
      const methodLabel = getMethodLabel(item.payment_method).toLowerCase();

      const matchesKeyword =
        !keyword ||
        partyName.includes(keyword) ||
        paymentId.includes(keyword) ||
        methodLabel.includes(keyword);

      return matchesStatus && matchesPeriod && matchesKeyword;
    });
  }, [payments, periodFilter, searchKeyword, statusFilter]);

  return (
    <div className="min-h-full bg-[#f5f7fb] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
            마이페이지 - 결제내역
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">내 결제내역</p>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="inline-flex h-14 min-w-[132px] appearance-none items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 pr-12 text-base font-extrabold text-slate-800 shadow-sm outline-none transition focus:border-slate-300"
                >
                  <option value="all">전체 상태</option>
                  <option value="approved">결제완료</option>
                  <option value="pending">입금대기</option>
                  <option value="rejected">결제실패</option>
                </select>
                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌄
                </span>
              </div>

              <div className="relative">
                <select
                  value={periodFilter}
                  onChange={(e) =>
                    setPeriodFilter(e.target.value as PeriodFilter)
                  }
                  className="inline-flex h-14 min-w-[132px] appearance-none items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 pr-12 text-base font-extrabold text-slate-800 shadow-sm outline-none transition focus:border-slate-300"
                >
                  <option value="3months">최근 3개월</option>
                  <option value="6months">최근 6개월</option>
                  <option value="all">전체 기간</option>
                </select>
                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌄
                </span>
              </div>
            </div>

            <div className="w-full xl:max-w-[260px]">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="파티명/결제ID 검색"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/30">
            <div className="hidden grid-cols-[1.2fr_2.4fr_1.2fr_1.1fr_1.4fr_1.2fr] items-center border-b border-slate-200 bg-slate-50 px-10 py-4 text-base font-extrabold text-slate-500 md:grid">
              <span>날짜</span>
              <span>파티</span>
              <span>금액</span>
              <span>상태</span>
              <span>결제 ID</span>
              <span>수단</span>
            </div>

            {loading ? (
              <div className="bg-white px-6 py-14 text-center">
                <p className="text-sm font-semibold text-slate-500">
                  결제 내역을 불러오는 중입니다...
                </p>
              </div>
            ) : error ? (
              <div className="bg-white px-6 py-14 text-center">
                <p className="text-sm font-bold text-rose-500">{error}</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="bg-white px-6 py-14 text-center">
                <p className="text-base font-extrabold text-slate-700">
                  결제 내역이 없습니다.
                </p>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  조건을 변경하거나 나중에 다시 확인해주세요.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 bg-white">
                {filteredPayments.map((item) => {
                  const statusMeta = getStatusMeta(item.status);
                  const displayDate = formatDate(
                    item.paid_at ?? item.created_at,
                  );

                  return (
                    <article
                      key={item.id}
                      className="grid gap-4 px-5 py-5 md:grid-cols-[1.2fr_2.4fr_1.2fr_1.1fr_1.4fr_1.2fr] md:items-center md:px-10"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-400 md:hidden">
                          날짜
                        </p>
                        <p className="text-[15px] font-bold text-slate-500">
                          {displayDate}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400 md:hidden">
                          파티
                        </p>
                        <p className="text-[17px] font-extrabold text-slate-900">
                          {getDisplayPartyName(item)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          정산월 {item.billing_month}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400 md:hidden">
                          금액
                        </p>
                        <p className="text-[17px] font-extrabold text-slate-900">
                          {formatPrice(item.amount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400 md:hidden">
                          상태
                        </p>
                        <span
                          className={`inline-flex rounded-full border px-4 py-2 text-sm font-extrabold ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400 md:hidden">
                          결제 ID
                        </p>
                        <p className="break-all text-[15px] font-bold text-slate-500">
                          {getDisplayPaymentId(item)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400 md:hidden">
                          수단
                        </p>
                        <p className="text-[15px] font-bold text-slate-500">
                          {getMethodLabel(item.payment_method)}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
