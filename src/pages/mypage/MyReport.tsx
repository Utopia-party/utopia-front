const reportRows = [
  {
    date: '2026-02-26',
    party: '주말 영화 파티',
    target: '닉네임1',
    reason: '노쇼/약속 불이행',
    status: '검토중',
    statusClass: 'border-blue-200 bg-blue-50 text-blue-700',
    reportId: 'REP-20260226-03',
  },
  {
    date: '2026-02-08',
    party: '전주 맛집 투어',
    target: '닉네임2',
    reason: '비매너/욕설',
    status: '처리완료',
    statusClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    reportId: 'REP-20260208-11',
  },
  {
    date: '2026-01-15',
    party: '볼링 번개',
    target: '닉네임3',
    reason: '기타',
    status: '반려',
    statusClass: 'border-rose-200 bg-rose-50 text-rose-700',
    reportId: 'REP-20260115-02',
  },
];

export default function MyReport() {
  return (
    <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
            마이페이지 - 신고내역
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
                placeholder="파티명/신고ID 검색"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/30">
            <div className="hidden grid-cols-[1.2fr_3fr_2fr_1.1fr_1.5fr] items-center border-b border-slate-200 bg-slate-50 px-10 py-4 text-base font-extrabold text-slate-500 md:grid">
              <span>날짜</span>
              <span>파티/대상</span>
              <span>사유</span>
              <span>상태</span>
              <span>신고 ID</span>
            </div>

            <div className="divide-y divide-slate-200 bg-white">
              {reportRows.map((row) => (
                <article
                  key={row.reportId}
                  className="grid gap-4 px-5 py-5 md:grid-cols-[1.2fr_3fr_2fr_1.1fr_1.5fr] md:items-center md:px-10"
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
                      파티/대상
                    </p>
                    <p className="text-[17px] font-extrabold text-slate-900">
                      {row.party}
                    </p>
                    <p className="mt-1 text-[15px] font-bold text-slate-500">
                      대상: {row.target}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 md:hidden">
                      사유
                    </p>
                    <p className="text-[17px] font-extrabold text-slate-900">
                      {row.reason}
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
                      신고 ID
                    </p>
                    <p className="text-[15px] font-bold text-slate-500">
                      {row.reportId}
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
