import { useLocation, Outlet } from 'react-router';

const summaryCards = [
  {
    label: '신뢰도 점수',
    value: '82점',
    icon: '🚨',
  },
  {
    label: '누적파티참여',
    value: '2회',
    icon: '✅',
  },
  {
    label: '참여파티 수',
    value: '1개',
    icon: '🗂️',
  },
];

const recentActivities = [
  {
    title: '정산 승인 완료',
    date: '2026-03-01',
    detail: '파티: 스터디룸 공유',
    score: '+3',
    scoreClass: 'text-emerald-500',
  },
  {
    title: '참여 후기 작성',
    date: '2026-02-24',
    detail: '파티: 전주 맛집 투어',
    score: '+2',
    scoreClass: 'text-emerald-500',
  },
  {
    title: '신고 접수(검토중)',
    date: '2026-02-26',
    detail: '사유: 노쇼/약속 불이행',
    score: '-5',
    scoreClass: 'text-rose-500',
  },
  {
    title: '이상 활동 없음',
    date: '2026-02-01',
    detail: '시스템 점검',
    score: '0',
    scoreClass: 'text-slate-500',
  },
];

function ProfileDashboard() {
  return (
    <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
            마이페이지 - 프로필
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            프로필 / 대시보드 / 최근 활동 내역
          </p>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white">
                  PU
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-extrabold text-slate-900">
                      홍길동 (닉네임)
                    </h2>
                  </div>
                  <span className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">
                    정상
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-primary transition hover:bg-blue-100"
              >
                프로필 수정
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400">이메일</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  akdjfjj@example.com
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400">전화번호</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  010-1234-5678
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400">생년월일</p>
                <p className="mt-1 text-sm font-extrabold text-slate-700">
                  생년월일 추가
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400">가입일</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  2025-11-18 &nbsp; (D+106)
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
              <p className="text-xs font-semibold text-slate-400">관심사</p>
              <p className="mt-1 text-sm font-extrabold text-slate-700">
                관심사 추가
              </p>
            </div>

            <p className="text-xs font-semibold text-slate-400">
              * 프로필 이미지는 “이미지 변경” 버튼으로 프로필 미리보기
              적용됩니다.
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900">대시보드</h3>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm shadow-sm">
                    {card.icon}
                  </div>
                  <p className="text-sm font-bold text-slate-600">
                    {card.label}
                  </p>
                </div>
                <p className="text-lg font-extrabold text-slate-900">
                  {card.value}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-400">
            * 대시보드 항목은 프로젝트 정책에 맞게 변경 가능.
          </p>
        </section>

        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              최근 활동 내역
            </h3>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
              >
                전체 활동 ▾
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
              >
                최근 7일 ▾
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {recentActivities.map((activity) => (
              <article
                key={`${activity.title}-${activity.date}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    {activity.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {activity.date} · {activity.detail}
                  </p>
                </div>
                <p className={`text-2xl font-extrabold ${activity.scoreClass}`}>
                  {activity.score}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Profile() {
  const location = useLocation();
  const isProfilePage =
    location.pathname === '/mypage' || location.pathname === '/mypage/profile';

  if (isProfilePage) {
    return <ProfileDashboard />;
  }

  return <Outlet />;
}
