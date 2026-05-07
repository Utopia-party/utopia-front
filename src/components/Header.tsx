import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import {
  applyNotificationSocketMessage,
  countUnreadNotifications,
  fetchMyNotifications,
  notificationKeys,
  subscribeNotificationSocket,
} from '../apis/notifications';
import type {
  NotificationItem,
  NotificationSocketMessage,
} from '../types/notifications';
import { NotificationDropdown } from './header/NotificationDropdown';
import { ProfileMenu } from './header/ProfileMenu';
import { SessionTimer } from './header/SessionTimer';
import { getProfileInitial, formatTrustScore } from './header/headerUtils';

const SESSION_WARNING_SECONDS = 60;

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { isLoggedIn, loading, logout, user, sessionExpiresAt, extendSession } =
    useAuthStore();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [ipBannedModal, setIpBannedModal] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);
  const [isExtendingSession, setIsExtendingSession] = useState(false);

  const notificationRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const isExtendingSessionRef = useRef(false);
  const hasLoggedOutBySessionExpiredRef = useRef(false);
  const lastAutoExtendedLocationRef = useRef<string | null>(null);
  const isForcedLogoutInProgressRef = useRef(false);

  const {
    data: notifications = [],
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
  } = useQuery<NotificationItem[]>({
    queryKey: notificationKeys.me,
    queryFn: fetchMyNotifications,
    enabled: isLoggedIn,
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const latestNotifications = useMemo(
    () =>
      [...notifications]
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 10),
    [notifications],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
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

  const isSessionWarningOpen =
    isLoggedIn &&
    sessionTimeLeft > 0 &&
    sessionTimeLeft < SESSION_WARNING_SECONDS;

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      console.error('로그아웃 실패', e);
    } finally {
      setIsProfileMenuOpen(false);
      navigate('/home', { replace: true });
    }
  }, [logout, navigate]);

  const handleExtendSession = useCallback(async () => {
    if (isExtendingSessionRef.current) return;

    try {
      isExtendingSessionRef.current = true;
      setIsExtendingSession(true);

      await extendSession();

      hasLoggedOutBySessionExpiredRef.current = false;
    } catch (error) {
      console.error('세션 연장 실패:', error);
      alert('세션이 만료되었습니다. 다시 로그인해주세요.');
      await handleLogout();
    } finally {
      isExtendingSessionRef.current = false;
      setIsExtendingSession(false);
    }
  }, [extendSession, handleLogout]);

  const requestAutoExtendSession = useCallback(
    (locationSignature: string) => {
      if (!isLoggedIn || !sessionExpiresAt) return;

      const now = Date.now();

      if (sessionExpiresAt <= now) return;

      if (sessionExpiresAt - now > SESSION_WARNING_SECONDS * 1000) return;

      if (lastAutoExtendedLocationRef.current === locationSignature) return;

      lastAutoExtendedLocationRef.current = locationSignature;
      void handleExtendSession();
    },
    [isLoggedIn, sessionExpiresAt, handleExtendSession],
  );

  useEffect(() => {
    const locationSignature = [
      location.key,
      location.pathname,
      location.search,
      location.hash,
    ].join('|');

    requestAutoExtendSession(locationSignature);
  }, [
    location.key,
    location.pathname,
    location.search,
    location.hash,
    requestAutoExtendSession,
  ]);

  useEffect(() => {
    hasLoggedOutBySessionExpiredRef.current = false;
  }, [sessionExpiresAt]);

  useEffect(() => {
    if (!isLoggedIn || !sessionExpiresAt) {
      setSessionTimeLeft(0);
      return;
    }

    const updateTimer = async () => {
      const remaining = Math.max(
        0,
        Math.floor((sessionExpiresAt - Date.now()) / 1000),
      );

      setSessionTimeLeft(remaining);

      if (remaining === 0 && !hasLoggedOutBySessionExpiredRef.current && !isForcedLogoutInProgressRef.current) {
        hasLoggedOutBySessionExpiredRef.current = true;
        await handleLogout();
      }
    };

    void updateTimer();

    const interval = window.setInterval(() => {
      void updateTimer();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isLoggedIn, sessionExpiresAt, handleLogout]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const unsubscribe = subscribeNotificationSocket(
      async (msg: NotificationSocketMessage) => {
        if (msg.type === 'ip_banned') {
          setIpBannedModal(true);
          return;
        }

        if (msg.type === 'force_logout') {
          const banType = msg.ban_type ?? null;
          const refId = msg.reference_id ?? '';

          isForcedLogoutInProgressRef.current = true;
          await logout();

          if (!banType) {
            navigate('/login?reason=duplicate');
            return;
          }

          const params = new URLSearchParams({
            reason: 'banned',
            ban_type: banType,
          });

          if (refId) params.set('ref_id', refId);

          navigate(`/login?${params.toString()}`);
          return;
        }

        queryClient.setQueryData<NotificationItem[]>(
          notificationKeys.me,
          (prev: NotificationItem[] = []) => {
            const next = applyNotificationSocketMessage(prev, msg);

            queryClient.setQueryData(
              notificationKeys.unreadCount,
              msg.unread_count ?? countUnreadNotifications(next),
            );

            return next;
          },
        );
      },
    );

    return unsubscribe;
  }, [isLoggedIn, queryClient, navigate, logout]);

  useEffect(() => {
    setProfileImageError(false);
  }, [user?.profile_image]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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

  return (
    <>
      <header className="flex h-16 items-center border-b border-gray-200 bg-card px-6">
        <div className="min-w-30">
          {isLoggedIn && user?.role?.toLowerCase() === 'admin' && (
            <Link
              to="/admin"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              관리자 콘솔 바로가기
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {sessionExpiresAt && (
                <SessionTimer
                  sessionTimeLeft={sessionTimeLeft}
                  onExtend={handleExtendSession}
                />
              )}

              <NotificationDropdown
                isOpen={isNotificationOpen}
                onToggle={() => {
                  setIsNotificationOpen((prev) => !prev);
                  setIsProfileMenuOpen(false);
                }}
                latestNotifications={latestNotifications}
                unreadCount={unreadCount}
                isLoading={isNotificationsLoading}
                isError={isNotificationsError}
                nickname={user?.nickname}
                containerRef={notificationRef}
              />

              <ProfileMenu
                isOpen={isProfileMenuOpen}
                onToggle={() => {
                  setIsProfileMenuOpen((prev) => !prev);
                  setIsNotificationOpen(false);
                }}
                onLogout={handleLogout}
                onClose={() => setIsProfileMenuOpen(false)}
                nickname={user?.nickname}
                email={user?.email}
                role={user?.role}
                profileImage={user?.profile_image}
                profileImageError={profileImageError}
                onProfileImageError={() => setProfileImageError(true)}
                profileInitial={profileInitial}
                trustScore={trustScore}
                containerRef={profileMenuRef}
              />
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

      {isSessionWarningOpen && (
        <div className="fixed inset-0 z-9998 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
            <div className="mb-4 text-4xl">⏰</div>

            <h2 className="mb-2 text-xl font-bold text-gray-900">
              자동 로그아웃 예정
            </h2>

            <p className="mb-6 text-sm leading-relaxed text-gray-600">
              보안을 위해 약 {sessionTimeLeft}초 뒤 자동 로그아웃됩니다.
              <br />
              계속 이용하시려면 세션을 연장해주세요.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleExtendSession}
                disabled={isExtendingSession}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isExtendingSession ? '연장 중...' : '계속 이용하기'}
              </button>

              <button
                onClick={() => {
                  void handleLogout();
                }}
                className="w-full rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {ipBannedModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
            <div className="mb-4 text-4xl">🚫</div>

            <h2 className="mb-2 text-xl font-bold text-gray-900">
              접속 차단됨
            </h2>

            <p className="mb-6 text-sm leading-relaxed text-gray-600">
              같은 IP 사용자의 규정 위반으로 인해
              <br />
              해당 IP의 접속이 차단되었습니다.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setIpBannedModal(false);
                  navigate('/login?reason=banned&ban_type=ip_ban');
                  void logout();
                }}
                className="w-full rounded-lg bg-gray-800 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                이의제기 신청
              </button>

              <button
                onClick={() => {
                  setIpBannedModal(false);
                  navigate('/');
                  void logout();
                }}
                className="w-full rounded-lg bg-rose-500 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
