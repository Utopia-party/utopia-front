// 홈 알림

// 알림 종류
export type NotificationType =
  | 'party_apply' // 파티 신청 (승인, 기각)
  | 'party' // 파티 관련
  | 'settlement'
  | 'payment'
  | 'report'
  | 'system'
  | string;

// 상태표시 대상 타입  (파티 / 결제 / 정산 / 신고) -> 해당 페이지 이동
export type NotificationReferenceType =
  | 'party'
  | 'settlement'
  | 'payment'
  | 'report'
  | 'user'
  | 'system'
  | string;

// 알림
export type NotificationItem = {
  id: string;
  user_id: string | null;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, any> | null;
  read_at: string | null;
  reference_id: string | null;
  type: NotificationType | null;
  title: string | null;
  message: string | null;
  reference_type: NotificationReferenceType | null;
};

// 웹소켓 이벤트 종류
export type NotificationSocketEventType =
  | 'connected'
  | 'notification_created'
  | 'notification_updated'
  | 'notification_read'
  | 'notification_deleted'
  | 'notifications_read_all'
  | 'unread_count_updated'
  | 'pong'
  | string;

export type NotificationSocketMessage = {
  type: NotificationSocketEventType;
  notification?: NotificationItem | null;
  notifications?: NotificationItem[] | null;
  notification_id?: string | null;
  unread_count?: number | null;
  message?: string | null;
  timestamp?: string | null;
};
