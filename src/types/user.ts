// ==============================
// 프로필 관련
// ==============================
export interface ReferrerItem {
  id: string;
  nickname: string;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  description?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
  target_id?: string | null;
  created_at?: string | null;
}

export interface GetMyProfileResponse {
  user_id: string;
  email: string;
  name?: string | null;
  nickname: string;
  phone?: string | null;
  provider: string;
  role: string;
  trust_score: number;
  profile_image?: string | null;
  created_at?: string | null;

  total_party_participations: number;
  active_party_count: number;

  recommendation_count: number;

  referrers: ReferrerItem[];
  referrer_count: number;

  recent_activities: RecentActivityItem[];
}

export type UpdateMyProfilePayload = {
  nickname: string;
  phone: string;
  profileImage?: File | null;
  removeProfileImage?: boolean;
};

export type UpdateMyProfileResponse = {
  message?: string;
  user?: {
    user_id?: string;
    email?: string;
    nickname?: string;
    phone?: string;
    provider?: string;
    role?: string;
    trust_score?: number;
    profile_image?: string | null;
    created_at?: string;
  };
};

// ==============================
// 신뢰도 관련
// ==============================
export interface TrustHistoryApiItem {
  id: number | string;
  title: string;
  detail: string;
  score_change: number;
  trust_score_after?: number | null;
  created_at: string;
}

export interface GetMyTrustHistoryResponse {
  items: TrustHistoryApiItem[];
}

// ==============================
// 결제 관련
// ==============================
export type PaymentMethod = 'card' | 'transfer' | null;
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface MyPaymentItem {
  id: string;
  party_id: string;
  party_title?: string | null;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  billing_month: string;
  paid_at: string | null;
  created_at: string;
  pg_transaction_id: string | null;
}

export interface GetMyPaymentsResponse {
  items: MyPaymentItem[];
}

// ==============================
// 추천인 관련
// ==============================
export interface GetMyReferrersResponse {
  referrers: ReferrerItem[];
  referrer_count: number;
}

export interface UpdateMyReferrersPayload {
  referrers: string[];
}

export interface UpdateMyReferrersResponse {
  message: string;
  referrers: ReferrerItem[];
}

// ==============================
// 회원 탈퇴 관련
// ==============================
export interface DeleteMyAccountPayload {
  password?: string;
}

export interface DeleteMyAccountResponse {
  message: string;
}
