import { api } from './api';
import type {
  NotificationItem,
  NotificationSocketMessage,
} from '../types/notifications';

// Reacr Query 캐시 키
export const notificationKeys = {
  all: ['notifications'] as const,
  me: ['notifications', 'me'] as const,
  latest: (limit = 10) => ['notifications', 'latest', limit] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

// 전체 알림
export const fetchMyNotifications = async (): Promise<NotificationItem[]> => {
  const { data } = await api.get('/api/notifications/me');
  return Array.isArray(data) ? sortNotificationsByCreatedAt(data) : [];
};

// 최신 알림
export const fetchLatestNotifications = async (
  limit = 10,
): Promise<NotificationItem[]> => {
  const { data } = await api.get('/api/notifications/latest', {
    params: { limit },
  });

  return Array.isArray(data) ? sortNotificationsByCreatedAt(data) : [];
};

// 개별 알림 읽음 처리(서버 요청)
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

// 알림 최신순 정렬
export const sortNotificationsByCreatedAt = (
  notifications: NotificationItem[],
): NotificationItem[] => {
  return [...notifications].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
};

// 알림 추가 및 수정
export const upsertNotification = (
  notifications: NotificationItem[],
  target: NotificationItem,
): NotificationItem[] => {
  const exists = notifications.some((item) => item.id === target.id);

  if (!exists) {
    return sortNotificationsByCreatedAt([target, ...notifications]);
  }

  return sortNotificationsByCreatedAt(
    notifications.map((item) => (item.id === target.id ? target : item)),
  );
};

// 개별 알림 삭제
export const removeNotification = (
  notifications: NotificationItem[],
  notificationId: string,
): NotificationItem[] => {
  return notifications.filter((item) => item.id !== notificationId);
};

// 개별 알림 읽음 처리 (프론트 배열 상태 수정)
export const markNotificationReadInList = (
  notifications: NotificationItem[],
  notificationId: string,
): NotificationItem[] => {
  return notifications.map((item) =>
    item.id === notificationId
      ? {
          ...item,
          is_read: true,
          read_at: item.read_at ?? new Date().toISOString(),
        }
      : item,
  );
};

// 모든 알림 읽음 처리
export const markAllNotificationsReadInList = (
  notifications: NotificationItem[],
): NotificationItem[] => {
  const now = new Date().toISOString();

  return notifications.map((item) => ({
    ...item,
    is_read: true,
    read_at: item.read_at ?? now,
  }));
};

// 안 읽은 알림 개수
export const countUnreadNotifications = (
  notifications: NotificationItem[],
): number => {
  return notifications.filter((item) => !item.is_read).length;
};

// 웹소켓 메시지를 알림 목록 상태에 반영하는 함수
// 기존 알림 배열을 어떻게 바꿀지 결정
export const applyNotificationSocketMessage = (
  notifications: NotificationItem[],
  socketMessage: NotificationSocketMessage,
): NotificationItem[] => {
  switch (socketMessage.type) {
    case 'notification_created':
    case 'notification_updated': {
      if (!socketMessage.notification) return notifications;
      return upsertNotification(notifications, socketMessage.notification);
    }

    case 'notification_read': {
      if (socketMessage.notification) {
        return upsertNotification(notifications, socketMessage.notification);
      }

      if (socketMessage.notification_id) {
        return markNotificationReadInList(
          notifications,
          socketMessage.notification_id,
        );
      }

      return notifications;
    }

    case 'notification_deleted': {
      if (!socketMessage.notification_id) return notifications;
      return removeNotification(notifications, socketMessage.notification_id);
    }

    case 'notifications_read_all': {
      if (Array.isArray(socketMessage.notifications)) {
        return sortNotificationsByCreatedAt(socketMessage.notifications);
      }

      return markAllNotificationsReadInList(notifications);
    }

    default:
      return notifications;
  }
};

type NotificationSocketListener = (message: NotificationSocketMessage) => void;

let notificationSocket: WebSocket | null = null; // 현재 웹소켓 인스턴스
let reconnectTimer: number | null = null; // 재연결 타이머
let manuallyClosed = false; // 사용자가 일부러 닫은 건지 확인
const socketListeners = new Set<NotificationSocketListener>(); // 구독 중인 리스너 목록

const getApiBaseUrl = (): string => {
  const baseURL =
    typeof api?.defaults?.baseURL === 'string' ? api.defaults.baseURL : '';

  if (baseURL) return baseURL;

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};

// 실제 웹소켓 주소 생성
const resolveNotificationSocketUrl = (): string => {
  const explicitWsUrl = import.meta.env.VITE_NOTIFICATION_WS_URL as
    | string
    | undefined;

  const wsPath =
    (import.meta.env.VITE_NOTIFICATION_WS_PATH as string | undefined) ??
    '/ws/notifications';

  let base = explicitWsUrl?.trim();

  if (!base) {
    const apiBaseUrl = getApiBaseUrl();

    if (apiBaseUrl.startsWith('https://')) {
      base = apiBaseUrl.replace(/^https:\/\//, 'wss://');
    } else if (apiBaseUrl.startsWith('http://')) {
      base = apiBaseUrl.replace(/^http:\/\//, 'ws://');
    } else if (typeof window !== 'undefined') {
      base = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    } else {
      base = '';
    }

    if (base && !explicitWsUrl) {
      const normalizedPath = wsPath.startsWith('/') ? wsPath : `/${wsPath}`;
      base = `${base}${normalizedPath}`;
    }
  }

  return base ?? '';
};

// 리스너 알림 및 재연결 관리
const notifySocketListeners = (message: NotificationSocketMessage) => {
  socketListeners.forEach((listener) => {
    try {
      listener(message);
    } catch (error) {
      console.error('알림 웹소켓 리스너 처리 실패:', error);
    }
  });
};

const clearReconnectTimer = () => {
  if (reconnectTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const scheduleReconnect = () => {
  if (typeof window === 'undefined') return;
  if (reconnectTimer !== null) return;
  if (manuallyClosed) return;
  if (socketListeners.size === 0) return;

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    ensureNotificationSocketConnection();
  }, 3000);
};

const closeNotificationSocket = () => {
  clearReconnectTimer();

  if (notificationSocket) {
    notificationSocket.close();
    notificationSocket = null;
  }
};

// 실제 웹소켓 연결
const ensureNotificationSocketConnection = () => {
  if (typeof window === 'undefined') return;
  if (notificationSocket?.readyState === WebSocket.OPEN) return;
  if (notificationSocket?.readyState === WebSocket.CONNECTING) return;
  if (socketListeners.size === 0) return;

  const wsUrl = resolveNotificationSocketUrl();
  if (!wsUrl) return;

  try {
    notificationSocket = new WebSocket(wsUrl);

    notificationSocket.onopen = () => {
      notifySocketListeners({
        type: 'connected',
        timestamp: new Date().toISOString(),
      });
    };

    notificationSocket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as NotificationSocketMessage;
        notifySocketListeners(parsed);
      } catch (error) {
        console.error('알림 웹소켓 메시지 파싱 실패:', error);
      }
    };

    notificationSocket.onerror = (error) => {
      console.error('알림 웹소켓 에러:', error);
    };

    notificationSocket.onclose = () => {
      notificationSocket = null;

      if (!manuallyClosed) {
        scheduleReconnect();
      }
    };
  } catch (error) {
    console.error('알림 웹소켓 연결 실패:', error);
    scheduleReconnect();
  }
};

// 외부에서 쓰는 구독 함수
export const subscribeNotificationSocket = (
  listener: NotificationSocketListener,
): (() => void) => {
  socketListeners.add(listener);
  manuallyClosed = false;
  ensureNotificationSocketConnection();

  return () => {
    socketListeners.delete(listener);

    if (socketListeners.size === 0) {
      manuallyClosed = true;
      closeNotificationSocket();
    }
  };
};
