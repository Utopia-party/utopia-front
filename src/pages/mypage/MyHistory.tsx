const historyRows = [
  {
    title: '정산 승인 완료',
    date: '2026-03-01',
    detail: '파티: 스터디룸 공유',
    score: '+3',
    scoreClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  {
    title: '참여 후기 작성',
    date: '2026-02-24',
    detail: '파티: 전주 맛집 투어',
    score: '+2',
    scoreClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  {
    title: '신고 접수(검토중)',
    date: '2026-02-26',
    detail: '사유: 노쇼/약속 불이행',
    score: '-5',
    scoreClass: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  {
    title: '이상 활동 없음',
    date: '2026-02-01',
    detail: '시스템 점검',
    score: '0',
    scoreClass: 'border-slate-200 bg-slate-50 text-slate-600',
  },
];

export default function MyHistory() {
  return (
    <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
            마이페이지 - 신뢰도 변화 이력
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
                전체
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
                placeholder="사유/파티명 검색"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {historyRows.map((row) => (
              <article
                key={`${row.title}-${row.date}`}
                className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-5 md:flex-row md:items-center md:justify-between md:px-10"
              >
                <div>
                  <p className="text-[17px] font-extrabold text-slate-900">
                    {row.title}
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-slate-500">
                    {row.date} · {row.detail}
                  </p>
                </div>

                <span
                  className={`inline-flex min-w-[96px] justify-center rounded-full border px-6 py-3 text-[18px] font-extrabold ${row.scoreClass}`}
                >
                  {row.score}
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
