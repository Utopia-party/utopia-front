export type PartyStatus = 'RECRUITING' | 'FULL' | 'COMPLETED' | 'CANCELED';

export interface Party {
  party_id: number;
  host_id: number | null;
  platform_id: number | null;
  title: string;
  status: PartyStatus | null;
  host_nickname: string | null;
  platform_name: string | null;
  category_name: string | null;
  member_count: number;
}

export interface PartyListResponse {
  parties: Party[];
  total: number;
  page: number;
  size: number;
}

export interface Category {
  category_id: number;
  category_name: string;
}

export interface SystemNotification {
  notification_id: number;
  user_id: number | null;
  type: string | null;
  content: string | null;
  is_read: boolean | null;
  created_at: string | null;
}
