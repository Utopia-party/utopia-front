import { api } from './api';
import type { NotificationItem } from '../types/notifications';

export const notificationKeys = {
  all: ['notifications'] as const,
  me: ['notifications', 'me'] as const,
  latest: ['notifications', 'latest'] as const,
};

export const fetchMyNotifications = async (): Promise<NotificationItem[]> => {
  const { data } = await api.get('/api/notifications/me');
  return Array.isArray(data) ? data : [];
};

export const fetchLatestNotifications = async (): Promise<
  NotificationItem[]
> => {
  const { data } = await api.get('/api/notifications/latest');
  return Array.isArray(data) ? data : [];
};
