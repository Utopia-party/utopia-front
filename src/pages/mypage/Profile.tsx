import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/authStore';

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

function getProfileInitial(nickname?: string | null) {
  if (!nickname) return 'PU';
  return nickname.trim().slice(0, 2).toUpperCase();
}

function ProfileDashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading } = useAuthStore();

  const nickname = user?.nickname ?? '';
  const email = user?.email ?? '';
  const provider = user?.provider ?? '';

  const profileInitial = useMemo(() => getProfileInitial(nickname), [nickname]);

  if (loading) {
    return (
      <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              프로필 정보를 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-extrabold text-slate-900">
              로그인이 필요합니다.
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              마이페이지는 로그인 후 이용할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white"
            >
              로그인 하러가기
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                  {profileInitial}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-extrabold text-slate-900">
                      {nickname}
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
                  {email || '-'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400">
                  로그인 방식
                </p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  {provider || '-'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400">닉네임</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  {nickname || '-'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400">
                  가입 상태
                </p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  정상
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {summaryCards.map((card) => (
                <article
                  key={card.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-500">
                      {card.label}
                    </p>
                    <span className="text-lg">{card.icon}</span>
                  </div>
                  <p className="mt-3 text-2xl font-extrabold text-slate-900">
                    {card.value}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                최근 활동 내역
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                최근 계정 활동과 신뢰도 반영 내역입니다.
              </p>
            </div>

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
