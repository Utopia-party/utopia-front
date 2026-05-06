export interface Message {
  type: 'message' | 'system' | 'warning' | 'error' | 'message_deleted';
  chat_id?: string;
  chat_ids?: string[];
  party_id?: string;
  user_id?: string;
  nickname?: string;
  profile_image?: string | null;
  content: string;
  created_at: string;
  unread_count?: number;
}

export interface Member {
  user_id: string;
  nickname: string;
  name?: string | null;
  role: string;
  status: string;
  trust_score?: number | null;
  joined_at?: string | null;
  profile_image?: string | null;
  payment_status?: 'completed' | 'pending' | null;
  is_active: boolean;
}

export interface PartyInfo {
  party_id: string;
  title: string;
  status?: string;
  max_members?: number | null;
  member_count?: number | null;
  monthly_price?: number | null;
  leader_discount_rate?: number | null;
  referral_discount_rate?: number | null;
  monthly_per_person?: number | null;
  quick_match_fee_rate?: number | null;
  is_leader?: boolean;
  has_referrer_discount?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  category_name?: string | null;
  service_name?: string | null;
  host_nickname?: string | null;
  members: Member[];
}

export interface ProfileDrawerUser {
  user_id?: string;
  nickname?: string;
  profile_image?: string | null;
  role?: string;
  status?: string;
  trust_score?: number | null;
  joined_at?: string | null;
  payment_status?: 'completed' | 'pending' | null;
}

export interface ProfileDrawerState {
  user: ProfileDrawerUser;
  top: number;
  left: number;
}

export type PaymentStep = 'select' | 'card' | 'transfer';
