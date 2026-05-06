import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  countUnreadNotifications,
  markAllNotificationsAsRead,
  markAllNotificationsReadInList,
  markNotificationAsRead,
  markNotificationReadInList,
  notificationKeys,
} from '../../apis/notifications';
import type { NotificationItem } from '../../types/notifications';
import {
  formatRelativeTime,
  getNotificationBadge,
  getNotificationTargetPath,
} from './headerUtils';

interface NotificationDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  latestNotifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  nickname?: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function NotificationDropdown({
  isOpen,
  onToggle,
  latestNotifications,
  unreadCount,
  isLoading,
  isError,
  nickname,
  containerRef,
}: NotificationDropdownProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const markOneMut = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<NotificationItem[]>(
        notificationKeys.me,
        (prev = []) => {
          const next = markNotificationReadInList(prev, id);
          queryClient.setQueryData(
            notificationKeys.unreadCount,
            countUnreadNotifications(next),
          );
          return next;
        },
      );
    },
  });

  const markAllMut = useMutation({
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

  const handleClick = async (item: NotificationItem) => {
    const targetPath = getNotificationTargetPath(item);
    try {
      if (!item.is_read) await markOneMut.mutateAsync(String(item.id));
    } catch (error) {
      console.error('개별 알림 읽음 처리 실패', error);
    }
    onToggle();
    if (targetPath) navigate(targetPath);
  };

  const handleMarkAll = async () => {
    try {
      await markAllMut.mutateAsync();
    } catch (error) {
      console.error('전체 알림 읽음 처리 실패', error);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
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

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-96 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                {nickname ?? '사용자'}님 알림
              </h3>
              {unreadCount > 0 && (
                <p className="mt-0.5 text-xs font-medium text-red-500">
                  읽지 않음 {unreadCount}개
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || markAllMut.isPending}
              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markAllMut.isPending ? '처리 중...' : '전체 읽음'}
            </button>
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {isLoading ? (
              <div className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                알림을 불러오는 중...
              </div>
            ) : isError ? (
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
                    onClick={() => handleClick(item)}
                    className={`w-full rounded-xl border p-3 text-left transition hover:bg-gray-50 ${item.is_read ? 'border-gray-100 bg-white' : 'border-blue-100 bg-blue-50'}`}
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
  );
}
