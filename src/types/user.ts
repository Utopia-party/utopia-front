// ==============================
// 프로필 관련
// ==============================
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
// 결제 관련
// ==============================

export type PaymentMethod = 'card' | 'transfer' | null;
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface MyPaymentItem {
  id: string;
  party_id: string;
  party_title?: string | null; // 없을 수도 있어서 optional
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  billing_month: string;
  paid_at: string | null;
  created_at: string;
  pg_transaction_id: string | null;
}

// API 응답이 배열일 수도 있고 {items: []}일 수도 있어서 둘 다 대응
export interface GetMyPaymentsResponse {
  items: MyPaymentItem[];
}
