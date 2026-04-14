import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from '../../apis/notifications';
import type {
  NotificationItem,
  NotificationSocketMessage,
} from '../../types/notifications';

/**
 * 전체 알림 목록
 */
type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NotificationDropdown({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  // 알림 목록 조회
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: notificationKeys.me,
    queryFn: fetchMyNotifications,
    enabled: open,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });

  // 웹소켓 구독
  useEffect(() => {
    if (!open) return;

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
  }, [open, queryClient]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  // 개별읽음
  const readOneMutation = useMutation({
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

  // 전체읽음
  const readAllMutation = useMutation({
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

  const handleClickNotification = async (item: NotificationItem) => {
    try {
      if (!item.is_read) {
        await readOneMutation.mutateAsync(item.id);
      }

      onClose();
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  const handleReadAll = async () => {
    try {
      await readAllMutation.mutateAsync();
    } catch (error) {
      console.error('전체 읽음 처리 실패:', error);
    }
  };

  if (!open) return null;

  return (
    <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">알림</h3>
          <p className="text-xs text-slate-500">
            읽지 않은 알림 {unreadCount}개
          </p>
        </div>

        <button
          type="button"
          onClick={handleReadAll}
          disabled={readAllMutation.isPending || unreadCount === 0}
          className="text-xs font-semibold text-indigo-600 disabled:text-slate-300"
        >
          {readAllMutation.isPending ? '처리 중...' : '전체 읽음'}
        </button>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            알림 불러오는 중...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            알림이 없습니다.
          </div>
        ) : (
          <ul>
            {notifications.map((item) => (
              <li
                key={item.id}
                className="border-b border-slate-100 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => handleClickNotification(item)}
                  className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                    item.is_read ? 'bg-white' : 'bg-blue-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      {!item.is_read ? (
                        <span className="block h-2.5 w-2.5 rounded-full bg-blue-500" />
                      ) : (
                        <span className="block h-2.5 w-2.5 rounded-full bg-slate-200" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-500">
                        {item.type || '알림'}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-xs text-slate-600">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
