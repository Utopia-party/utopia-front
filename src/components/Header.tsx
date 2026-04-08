import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { fetchMyNotifications, notificationKeys } from '../apis/notifications';

type NotificationItem = {
  id: string;
  user_id: string | null;
  type: string | null;
  title: string | null;
  message: string | null;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

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

export default function Header() {
  const navigate = useNavigate();
  const { isLoggedIn, loading, logout, user } = useAuthStore();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const {
    data: notifications = [],
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
  } = useQuery<NotificationItem[]>({
    queryKey: notificationKeys.me,
    queryFn: fetchMyNotifications,
    enabled: isLoggedIn,
  });

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  if (loading) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 실패', error);
    } finally {
      alert('로그아웃 되었습니다.');
      navigate('/home', { replace: true });
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    // 나중에 reference_type / reference_id 기준으로 이동 처리 가능
    // 예:
    // if (item.reference_type === 'party' && item.reference_id) {
    //   navigate(`/party/${item.reference_id}`);
    //   return;
    // }

    if (item.reference_type === 'party' && item.reference_id) {
      navigate(`/party/${item.reference_id}`);
      setIsNotificationOpen(false);
      return;
    }

    setIsNotificationOpen(false);
  };

  return (
    <header className="flex h-16 items-center justify-end border-b-2 border-gray-200 bg-card px-8">
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
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
                <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800">알림</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs font-medium text-red-500">
                        읽지 않음 {unreadCount}개
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {isNotificationsLoading ? (
                      <div className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                        알림을 불러오는 중...
                      </div>
                    ) : isNotificationsError ? (
                      <div className="rounded-xl bg-red-50 px-4 py-6 text-center text-sm text-red-500">
                        알림을 불러오지 못했습니다.
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((item) => (
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
                              {item.title && (
                                <p className="text-sm font-semibold text-gray-800">
                                  {item.title}
                                </p>
                              )}

                              <p className="mt-1 text-sm text-gray-700 break-words">
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
                      ))
                    ) : (
                      <div className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                        새 알림이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">
                {user?.nickname ?? '사용자'}
              </span>
              님
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              로그아웃
            </button>
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
