import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { getMyProfile } from '../../apis/user';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuthStore } from '../../stores/authStore';

import ProfileEditModal from './components/ProfileEditModal';
import ReferrerEditModal from './components/ReferrerEditModal';
import WithdrawModal from './components/WithdrawModal';

import type {
  GetMyProfileResponse,
  RecentActivityItem,
} from '../../types/user';

const RECENT_ACTIVITY_PREVIEW_COUNT = 5;

function getProfileInitial(nickname?: string | null) {
  if (!nickname) return 'PU';
  return nickname.trim().slice(0, 2).toUpperCase();
}

function formatPhoneNumber(phone?: string | null) {
  if (!phone) return '';

  const numbers = phone.replace(/\D/g, '');

  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }

  if (numbers.length === 10) {
    if (numbers.startsWith('02')) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    }

    return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }

  if (numbers.length === 9 && numbers.startsWith('02')) {
    return numbers.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
  }

  return phone;
}

function formatTrustScore(score?: number | null) {
  if (score === null || score === undefined) return '-';
  return `${score}점`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatActionLabel(action?: string | null) {
  if (!action) return '활동';

  return action
    .split('_')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function getActivityScore(activity: RecentActivityItem) {
  const rawScore = activity.metadata?.score_change;

  if (typeof rawScore !== 'number') {
    return null;
  }

  if (rawScore > 0) {
    return {
      text: `+${rawScore}`,
      className: 'text-emerald-500',
    };
  }

  if (rawScore < 0) {
    return {
      text: `${rawScore}`,
      className: 'text-rose-500',
    };
  }

  return {
    text: '0',
    className: 'text-slate-500',
  };
}

function getMyReferrers(profile: GetMyProfileResponse | null): string[] {
  const referrers =
    profile?.referrers?.map((item) => item.nickname).filter(Boolean) ?? [];

  return referrers;
}

function ProfileDashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading } = useAuthStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReferrerEditOpen, setIsReferrerEditOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [profile, setProfile] = useState<GetMyProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      setProfileLoading(true);
      setProfileError(null);

      const data = await getMyProfile();
      setProfile(data);
    } catch (error) {
      console.error(error);
      setProfileError('프로필 정보를 불러오지 못했습니다.');
    } finally {
      setProfileLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!isEditOpen && !isReferrerEditOpen && isLoggedIn) {
      void fetchProfile();
    }
  }, [isEditOpen, isReferrerEditOpen, isLoggedIn, fetchProfile]);

  const nickname = profile?.nickname ?? user?.nickname ?? '';
  const rawPhone = profile?.phone ?? user?.phone ?? '';
  const phone = formatPhoneNumber(rawPhone);

  const trustScore = formatTrustScore(
    profile?.trust_score ?? user?.trust_score ?? null,
  );

  const profileImageUrl = profile?.profile_image ?? user?.profile_image ?? null;
  const totalPartyParticipations = profile?.total_party_participations ?? 0;
  const activePartyCount = profile?.active_party_count ?? 0;
  const recommendedCount = profile?.recommendation_count ?? 0;

  const myReferrers = getMyReferrers(profile);
  const recommendedByMeCount = profile?.referrer_count ?? myReferrers.length;

  const recentActivities = profile?.recent_activities ?? [];

  const profileInitial = useMemo(() => getProfileInitial(nickname), [nickname]);

  const visibleActivities = recentActivities.slice(
    0,
    RECENT_ACTIVITY_PREVIEW_COUNT,
  );

  useEffect(() => {
    setImageError(false);
  }, [profileImageUrl]);

  const showProfileImage = Boolean(profileImageUrl) && !imageError;

  if (loading || profileLoading) {
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
    <>
      <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7">
            <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
              마이페이지 - 프로필
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              회원 정보 / 최근 활동 내역
            </p>
          </div>

          {profileError ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              {profileError}
            </div>
          ) : null}

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl font-extrabold text-white shadow-sm sm:h-24 sm:w-24 sm:text-3xl">
                    {showProfileImage ? (
                      <img
                        src={profileImageUrl!}
                        alt=""
                        onError={() => setImageError(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profileInitial
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[22px] font-extrabold tracking-tight text-slate-900 sm:text-[24px]">
                        {nickname}
                      </h2>

                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">
                        정상
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                      파티 활동과 신뢰 정보를 한눈에 볼 수 있는 내 프로필입니다.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                        <span className="mr-2 text-slate-400">전화번호</span>
                        <span className="text-slate-800">{phone || '-'}</span>
                      </div>

                      <div className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                        <span className="mr-2 text-emerald-500">신뢰도</span>
                        <span>{trustScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-primary transition hover:bg-blue-100"
                  >
                    프로필 수정
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWithdrawOpen(true)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-500 transition hover:bg-rose-100"
                  >
                    회원탈퇴
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-primary">
                        추천한 수
                      </p>

                      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                        {recommendedByMeCount}
                        <span className="ml-1 text-base font-bold text-slate-500">
                          명
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsReferrerEditOpen(true)}
                      // disabled={myReferrers.length >= MAX_REFERRERS}
                      className="shrink-0 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      추천인 추가
                    </button>
                  </div>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    기존 추천인은 최신순으로 조회되며, 한 번에 한 명만 추가할 수
                    있습니다.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold text-slate-400">
                    추천받은 수
                  </p>

                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                    {recommendedCount}
                    <span className="ml-1 text-base font-bold text-slate-500">
                      회
                    </span>
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    다른 사용자에게 받은 추천 횟수
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold text-slate-400">
                    누적 파티 참여
                  </p>

                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                    {totalPartyParticipations}
                    <span className="ml-1 text-base font-bold text-slate-500">
                      회
                    </span>
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    지금까지 참여한 전체 파티 기록
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold text-slate-400">
                    참여 중인 파티
                  </p>

                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                    {activePartyCount}
                    <span className="ml-1 text-base font-bold text-slate-500">
                      개
                    </span>
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    현재 진행 중인 파티 수
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                최근 활동 내역
              </h3>

              <p className="mt-1 text-sm font-medium text-slate-500">
                최근 계정 활동과 신뢰도 반영 내역입니다.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {recentActivities.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm font-semibold text-slate-500">
                  최근 활동 내역이 없습니다.
                </div>
              ) : (
                visibleActivities.map((activity) => {
                  const score = getActivityScore(activity);

                  return (
                    <article
                      key={activity.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4"
                    >
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {formatActionLabel(activity.action)}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {formatDate(activity.created_at)}
                          {activity.description
                            ? ` · ${activity.description}`
                            : ''}
                        </p>
                      </div>

                      {score ? (
                        <p
                          className={`text-2xl font-extrabold ${score.className}`}
                        >
                          {score.text}
                        </p>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      <ProfileEditModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialValues={{
          nickname,
          phone: rawPhone,
          profileImage: profileImageUrl,
        }}
      />

      <ReferrerEditModal
        open={isReferrerEditOpen}
        onClose={() => setIsReferrerEditOpen(false)}
        initialReferrers={myReferrers}
        onSaved={() => {
          void fetchProfile();
        }}
      />

      <WithdrawModal
        open={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
      />
    </>
  );
}

export default function Profile() {
  const location = useLocation();

  const isProfilePage =
    location.pathname === '/mypage' || location.pathname === '/mypage/profile';

  usePageTitle('프로필');

  if (isProfilePage) {
    return <ProfileDashboard />;
  }

  return <Outlet />;
}
