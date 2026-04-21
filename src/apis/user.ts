import { api } from './api';
import type {
  MyPaymentItem,
  GetMyPaymentsResponse,
  UpdateMyProfilePayload,
  UpdateMyProfileResponse,
} from '../types/user';

// 마이페이지 - 프로필
// 최근활동 내역
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

export interface RecentActivityItem {
  id: string;
  action: string;
  description?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
  target_id?: string | null;
  created_at: string;
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
  created_at?: string;
  total_party_participations: number;
  active_party_count: number;
  recommendation_count: number;
  recent_activities: RecentActivityItem[];
}

// 내 프로필 조회
export async function getMyProfile(): Promise<GetMyProfileResponse> {
  const { data } = await api.get<GetMyProfileResponse>('/api/users/me/profile');
  return data;
}

// 마이페이지 프로필 이미지/닉네임/휴대전화 수정
export async function updateMyProfile(
  payload: UpdateMyProfilePayload,
): Promise<UpdateMyProfileResponse> {
  const formData = new FormData();

  formData.append('nickname', payload.nickname);
  formData.append('phone', payload.phone);

  if (payload.profileImage) {
    formData.append('profile_image', payload.profileImage);
  }

  if (payload.removeProfileImage) {
    formData.append('remove_profile_image', 'true');
  }

  const { data } = await api.patch<UpdateMyProfileResponse>(
    '/api/users/me/profile',
    formData,
  );

  return data;
}

// 마이페이지 - 신뢰도 변화
export async function getMyTrustHistory(): Promise<GetMyTrustHistoryResponse> {
  const { data } = await api.get<GetMyTrustHistoryResponse>(
    '/api/users/me/trust-history',
  );

  return data;
}

// ==============================
// 결제 내역 조회
// ==============================
export async function fetchMyPayments(): Promise<MyPaymentItem[]> {
  const { data } = await api.get<MyPaymentItem[] | GetMyPaymentsResponse>(
    '/api/mypage/payments',
  );

  if (Array.isArray(data)) {
    return data;
  }

  return data.items ?? [];
}
