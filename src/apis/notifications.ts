import { api } from './api';
import type { NotificationItem } from '../types/notifications';

export const notificationKeys = {
  all: ['notifications'] as const,
  me: ['notifications', 'me'] as const,
  latest: (limit = 10) => ['notifications', 'latest', limit] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

// 전체 알림
export const fetchMyNotifications = async (): Promise<NotificationItem[]> => {
  const { data } = await api.get('/api/notifications/me');
  return Array.isArray(data) ? data : [];
};

// 최신 알림 N개
export const fetchLatestNotifications = async (
  limit = 10,
): Promise<NotificationItem[]> => {
  const { data } = await api.get('/api/notifications/latest', {
    params: { limit },
  });

  return Array.isArray(data) ? data : [];
};

// 개별 알림 읽음 처리
export const markNotificationAsRead = async (
  notificationId: string,
): Promise<{ message?: string }> => {
  const { data } = await api.patch(`/api/notifications/${notificationId}/read`);
  return data ?? {};
};

// 전체 읽음 처리
export const markAllNotificationsAsRead = async (): Promise<{
  message?: string;
}> => {
  const { data } = await api.patch('/api/notifications/read-all');
  return data ?? {};
};
