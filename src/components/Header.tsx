import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import {
  applyNotificationSocketMessage,
  countUnreadNotifications,
  fetchMyNotifications,
  markAllNotificationsAsRead,
  markAllNotificationsReadInList,
  markNotificationAsRead,
  markNotificationReadInList,
  notificationKeys,
  subscribeNotificationSocket,
} from '../apis/notifications';
import type {
  NotificationItem,
  NotificationSocketMessage,
} from '../types/notifications';

function formatRelativeTime(dateString: string | null) {
  if (!dateString) return '';

  const now = new Date();
  const target = new Date(dateString);

  if (Number.isNaN(target.getTime())) return '';

  const diffMs = now.getTime() - target.getTime();

  if (diffMs < 60 * 1000) return '방금 전';

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days}일 전`;

  return target.toLocaleDateString('ko-KR');
}

function getNotificationBadge(item: NotificationItem) {
  const refType = item.reference_type?.toLowerCase();
  const type = item.type?.toLowerCase();

  if (refType === 'report' || type === 'report') {
    return {
      label: '신고',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }

  if (
    refType === 'settlement' ||
    refType === 'payment' ||
    type === 'settlement' ||
    type === 'payment'
  ) {
    return {
      label: '결제',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (refType === 'party' || type?.includes('party')) {
    return {
      label: '파티',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    };
  }

  return {
    label: '알림',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  };
}

// 알림 클릭 시 이동 페이지
function getNotificationTargetPath(item: NotificationItem) {
  const refType = item.reference_type?.toLowerCase();
  const type = item.type?.toLowerCase();

  // 신고
  if (refType === 'report' || type === 'report') {
    return '/mypage/report';
  }

  // 정산, 결제
  if (
    refType === 'settlement' ||
    refType === 'payment' ||
    type === 'settlement' ||
    type === 'payment'
  ) {
    return '/mypage/payment';
  }

  // 파티
  if (refType === 'party' || type?.includes('party')) {
    return '/mypage/party';
  }

  return null;
}

function getProfileInitial(nickname?: string | null) {
  if (!nickname) return 'PU';
  return nickname.trim().slice(0, 2).toUpperCase();
}

function formatTrustScore(score?: number | null) {
  if (score === null || score === undefined) return null;
  return `${score}점`;
}

export default function Header() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoggedIn, loading, logout, user } = useAuthStore();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);

  const notificationRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const {
    data: notifications = [],
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
  } = useQuery<NotificationItem[]>({
    queryKey: notificationKeys.me,
    queryFn: fetchMyNotifications,
    enabled: isLoggedIn,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });

  const latestNotifications = useMemo(() => {
    return [...notifications]
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const profileInitial = useMemo(
    () => getProfileInitial(user?.nickname),
    [user?.nickname],
  );

  const trustScore = useMemo(
    () => formatTrustScore(user?.trust_score ?? null),
    [user?.trust_score],
  );

  const showProfileImage = Boolean(user?.profile_image) && !profileImageError;

  // 개별 읽음 처리
  const markOneAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData<NotificationItem[]>(
        notificationKeys.me,
        (prev = []) => {
          const next = markNotificationReadInList(prev, notificationId);

          queryClient.setQueryData(
            notificationKeys.unreadCount,
            countUnreadNotifications(next),
          );

          return next;
        },
      );
    },
  });

  // 전체 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.setQueryData<NotificationItem[]>(
        notificationKeys.me,
        (prev = []) => {
          const next = markAllNotificationsReadInList(prev);

          queryClient.setQueryData(notificationKeys.unreadCount, 0);

          return next;
        },
      );
    },
  });

  useEffect(() => {
    if (!isLoggedIn) return;

    const unsubscribe = subscribeNotificationSocket(
      (socketMessage: NotificationSocketMessage) => {
        queryClient.setQueryData<NotificationItem[]>(
          notificationKeys.me,
          (prev = []) => {
            const next = applyNotificationSocketMessage(prev, socketMessage);

            queryClient.setQueryData(
              notificationKeys.unreadCount,
              socketMessage.unread_count ?? countUnreadNotifications(next),
            );

            return next;
          },
        );
      },
    );

    return unsubscribe;
  }, [isLoggedIn, queryClient]);

  useEffect(() => {
    setProfileImageError(false);
  }, [user?.profile_image]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setIsNotificationOpen(false);
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (loading) return null;

  // 아래 핸들러들은 여기 있어도 괜찮음
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 실패', error);
    } finally {
      setIsProfileMenuOpen(false);
      alert('로그아웃 되었습니다.');
      navigate('/home', { replace: true });
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    const targetPath = getNotificationTargetPath(item);

    try {
      if (!item.is_read) {
        await markOneAsReadMutation.mutateAsync(String(item.id));
      }
    } catch (error) {
      console.error('개별 알림 읽음 처리 실패', error);
    }

    setIsNotificationOpen(false);

    if (targetPath) {
      navigate(targetPath);
    }
  };

  const handleReadAllNotifications = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('전체 알림 읽음 처리 실패', error);
    }
  };

  return (
    <header className="flex h-16 items-center border-b border-gray-200 bg-card px-6">
      <div className="min-w-[120px]">
        {isLoggedIn && user?.role?.toLowerCase() === 'admin' && (
          <Link
            to="/admin"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            관리자 콘솔 바로가기
          </Link>
        )}
      </div>

      {/* 오른쪽: 알림, 유저 */}
      <div className="ml-auto flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationOpen((prev) => !prev);
                  setIsProfileMenuOpen(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition hover:bg-gray-50"
                aria-label="알림"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
                  />
                </svg>

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-12 z-50 w-96 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        {user?.nickname ?? '사용자'}님 알림
                      </h3>
                      {unreadCount > 0 && (
                        <p className="mt-0.5 text-xs font-medium text-red-500">
                          읽지 않음 {unreadCount}개
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleReadAllNotifications}
                      disabled={
                        unreadCount === 0 || markAllAsReadMutation.isPending
                      }
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {markAllAsReadMutation.isPending
                        ? '처리 중...'
                        : '전체 읽음'}
                    </button>
                  </div>

                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {isNotificationsLoading ? (
                      <div className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                        알림을 불러오는 중...
                      </div>
                    ) : isNotificationsError ? (
                      <div className="rounded-xl bg-red-50 px-4 py-6 text-center text-sm text-red-500">
                        알림을 불러오지 못했습니다.
                      </div>
                    ) : latestNotifications.length > 0 ? (
                      latestNotifications.map((item) => {
                        const badge = getNotificationBadge(item);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNotificationClick(item)}
                            className={`w-full rounded-xl border p-3 text-left transition hover:bg-gray-50 ${
                              item.is_read
                                ? 'border-gray-100 bg-white'
                                : 'border-blue-100 bg-blue-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.className}`}
                                  >
                                    {badge.label}
                                  </span>

                                  {item.title && (
                                    <p className="truncate text-sm font-semibold text-gray-800">
                                      {item.title}
                                    </p>
                                  )}
                                </div>

                                <p className="mt-1 break-words whitespace-pre-line text-sm text-gray-700">
                                  {item.message ?? '알림 내용이 없습니다.'}
                                </p>
                              </div>

                              {!item.is_read && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                              )}
                            </div>

                            <p className="mt-2 text-xs text-gray-400">
                              {formatRelativeTime(item.created_at)}
                            </p>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                        새 알림이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen((prev) => !prev);
                  setIsNotificationOpen(false);
                }}
                className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-slate-300 hover:bg-slate-50"
                aria-label="프로필 메뉴"
                aria-expanded={isProfileMenuOpen}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-white">
                  {showProfileImage ? (
                    <img
                      src={user?.profile_image ?? ''}
                      alt=""
                      onError={() => setProfileImageError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    profileInitial
                  )}
                </div>

                <div className="hidden min-w-0 text-left sm:block">
                  <p className="max-w-[120px] truncate text-sm font-semibold text-slate-800">
                    {user?.nickname ?? '사용자'}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    내 프로필
                  </p>
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-base font-bold text-white shadow-sm">
                        {showProfileImage ? (
                          <img
                            src={user?.profile_image ?? ''}
                            alt=""
                            onError={() => setProfileImageError(true)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          profileInitial
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pt-1">
                        <p className="truncate text-base font-bold text-slate-900">
                          {user?.nickname ?? '사용자'}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {user?.email ?? '이메일 정보 없음'}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                            {user?.role === 'admin' ? '관리자' : '일반회원'}
                          </span>

                          {trustScore && (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                              신뢰도 {trustScore}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/mypage/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>마이페이지</span>
                      <span className="text-slate-300">›</span>
                    </Link>

                    <Link
                      to="/mypage/party"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>내 파티</span>
                      <span className="text-slate-300">›</span>
                    </Link>

                    <Link
                      to="/mypage/payment"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>결제 / 정산</span>
                      <span className="text-slate-300">›</span>
                    </Link>

                    <Link
                      to="/mypage/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>설정</span>
                      <span className="text-slate-300">›</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <span>로그아웃</span>
                      <span className="text-rose-300">›</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium transition hover:bg-muted"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
