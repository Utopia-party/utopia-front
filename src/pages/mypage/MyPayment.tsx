const paymentRows = [
  {
    date: '2026-03-02',
    party: '주말 영화 파티',
    amount: '₩ 12,000',
    status: '결제완료',
    statusClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    paymentId: 'PAY-20260302-01',
  },
  {
    date: '2026-02-23',
    party: '스터디룸 공유',
    amount: '₩ 20,000',
    status: '정산대기',
    statusClass: 'border-amber-200 bg-amber-50 text-amber-700',
    paymentId: 'PAY-20260223-07',
  },
  {
    date: '2026-02-10',
    party: '전주 맛집 투어',
    amount: '₩ 10,000',
    status: '결제완료',
    statusClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    paymentId: 'PAY-20260210-13',
  },
  {
    date: '2026-01-28',
    party: '볼링 번개',
    amount: '₩ 15,000',
    status: '실패',
    statusClass: 'border-rose-200 bg-rose-50 text-rose-700',
    paymentId: 'PAY-20260128-02',
  },
];

export default function MyPayment() {
  return (
    <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
            마이페이지 - 결제내역
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            프로필/결제 내역/신고 내역/신뢰도 변화 이력/활동 로그
          </p>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                className="inline-flex h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 text-base font-extrabold text-slate-800 shadow-sm"
              >
                전체 상태
                <span className="ml-6 text-slate-400">⌄</span>
              </button>

              <button
                type="button"
                className="inline-flex h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 text-base font-extrabold text-slate-800 shadow-sm"
              >
                최근 3개월
                <span className="ml-6 text-slate-400">⌄</span>
              </button>
            </div>

            <div className="w-full xl:max-w-[220px]">
              <input
                type="text"
                placeholder="파티명/결제ID 검색"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/30">
            <div className="hidden grid-cols-[1.2fr_3fr_1.2fr_1.1fr_1.4fr] items-center border-b border-slate-200 bg-slate-50 px-10 py-4 text-base font-extrabold text-slate-500 md:grid">
              <span>날짜</span>
              <span>파티</span>
              <span>금액</span>
              <span>상태</span>
              <span>결제 ID</span>
            </div>

            <div className="divide-y divide-slate-200 bg-white">
              {paymentRows.map((row) => (
                <article
                  key={row.paymentId}
                  className="grid gap-4 px-5 py-5 md:grid-cols-[1.2fr_3fr_1.2fr_1.1fr_1.4fr] md:items-center md:px-10"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-400 md:hidden">
                      날짜
                    </p>
                    <p className="text-[15px] font-bold text-slate-500">
                      {row.date}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 md:hidden">
                      파티
                    </p>
                    <p className="text-[17px] font-extrabold text-slate-900">
                      {row.party}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 md:hidden">
                      금액
                    </p>
                    <p className="text-[17px] font-extrabold text-slate-900">
                      {row.amount}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 md:hidden">
                      상태
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-4 py-2 text-sm font-extrabold ${row.statusClass}`}
                    >
                      {row.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 md:hidden">
                      결제 ID
                    </p>
                    <p className="text-[15px] font-bold text-slate-500">
                      {row.paymentId}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
