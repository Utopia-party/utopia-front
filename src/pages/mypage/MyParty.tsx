const partyCards = [
  {
    category: 'OTT',
    title: 'Netflix 프리미엄 파티',
    status: '내가 만든 파티',
    memberCount: '3/4',
    location: '온라인',
    price: '1인당 ₩ 4,000',
    isOwner: true,
    note: '리더 권한: 모집 상태 관리/강퇴/리더 위임/파티 종료(스케줄링)',
  },
  {
    category: '쇼핑',
    title: '쿠팡 로켓와우 파티',
    status: '참여중',
    memberCount: '2/4',
    location: '온라인',
    price: '1인당 ₩ 2,000',
    isOwner: false,
    note: '채팅방에서: 정산요청/영수증 인증/채팅 신고 가능',
  },
  {
    category: '교육',
    title: 'ChatGPT Plus 공동구매',
    status: '참여중',
    memberCount: '4/5',
    location: '온라인',
    price: '총액 ₩ 25,000',
    isOwner: false,
    note: '공동구매형 파티: 가격/배송/인증 흐름 확장 가능',
  },
];

function StatusBadge({ label, isOwner }: { label: string; isOwner: boolean }) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-4 py-2 text-sm font-extrabold',
        isOwner
          ? 'border-orange-200 bg-orange-50 text-orange-500'
          : 'border-orange-200 bg-orange-50 text-orange-500',
      ].join(' ')}
    >
      {label}
    </span>
  );
}

export default function MyParty() {
  return (
    <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-7">
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
            참여중인 파티
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            파티 탈퇴 · (내가 만든 파티) 참여자 강퇴/리더 위임 · 채팅방 이동
          </p>
        </div>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {partyCards.map((party) => (
            <article
              key={party.title}
              className="flex min-h-[610px] flex-col rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-600">
                  {party.category}
                </span>
                <StatusBadge label={party.status} isOwner={party.isOwner} />
              </div>

              <h2 className="mt-5 text-[22px] font-extrabold leading-tight text-slate-900">
                {party.title}
              </h2>

              <div className="mt-7 flex flex-col gap-3 text-slate-700">
                <p className="text-[18px] font-extrabold text-slate-800">
                  👥 {party.memberCount}
                </p>
                <p className="text-[16px] font-bold">📍 {party.location}</p>
                <p className="text-[16px] font-extrabold text-slate-800">
                  💰 {party.price}
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-4">
                <button
                  type="button"
                  className="h-14 rounded-full border border-slate-200 bg-white text-[16px] font-extrabold text-slate-900 transition hover:bg-slate-50"
                >
                  파티 탈퇴
                </button>

                {party.isOwner ? (
                  <>
                    <button
                      type="button"
                      className="h-14 rounded-full border border-blue-200 bg-white text-[16px] font-extrabold text-primary transition hover:bg-blue-50"
                    >
                      참여자 강퇴
                    </button>
                    <button
                      type="button"
                      className="h-14 rounded-full border border-blue-200 bg-white text-[16px] font-extrabold text-primary transition hover:bg-blue-50"
                    >
                      리더 위임
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  className="mt-2 h-16 w-[184px] rounded-full bg-primary text-[16px] font-extrabold text-white transition hover:opacity-90"
                >
                  채팅방
                </button>
              </div>

              <p className="mt-auto pt-5 text-sm font-semibold leading-6 text-slate-500">
                {party.note}
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
