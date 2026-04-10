// 홈 알림
export type NotificationType =
  | 'party_apply'
  | 'settlement'
  | 'report'
  | 'system'
  | string;

export type NotificationReferenceType =
  | 'party'
  | 'settlement'
  | 'report'
  | 'user'
  | string;

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
