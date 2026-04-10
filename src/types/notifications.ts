// 홈 알림

// 알림 종류
export type NotificationType =
  | 'party_apply' // 파티 신청
  | 'party' // 파티 관련 (승인, 기각)
  | 'settlement'
  | 'payment'
  | 'report'
  // | 'system'
  | string;

// 상태표시 대상 타입  (파티 / 결제 / 신고) -> 해당 페이지 이동
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
