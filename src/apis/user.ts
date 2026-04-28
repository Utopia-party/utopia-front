import { api } from './api';
import type {
  MyPaymentItem,
  GetMyPaymentsResponse,
  UpdateMyProfilePayload,
  UpdateMyProfileResponse,
} from '../types/user';

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
  created_at?: string | null;
}

export interface ReferrerItem {
  id: string;
  nickname: string;
}

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

  // 나를 추천인으로 등록한 사용자 수
  recommendation_count: number;

  // 내가 등록한 추천인 목록/수
  referrers: ReferrerItem[];
  referrer_count: number;

  recent_activities: RecentActivityItem[];
}

export async function getMyProfile(): Promise<GetMyProfileResponse> {
  const { data } = await api.get<GetMyProfileResponse>('/api/users/me/profile');
  return data;
}

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

export async function getMyTrustHistory(): Promise<GetMyTrustHistoryResponse> {
  const { data } = await api.get<GetMyTrustHistoryResponse>(
    '/api/users/me/trust-history',
  );

  return data;
}

export async function fetchMyPayments(): Promise<MyPaymentItem[]> {
  const { data } = await api.get<MyPaymentItem[] | GetMyPaymentsResponse>(
    '/api/mypage/payments',
  );

  if (Array.isArray(data)) {
    return data;
  }

  return data.items ?? [];
}

export interface DeleteMyAccountPayload {
  password?: string;
}

export interface DeleteMyAccountResponse {
  message: string;
}

export async function deleteMyAccount(
  payload?: DeleteMyAccountPayload,
): Promise<DeleteMyAccountResponse> {
  const { data } = await api.delete<DeleteMyAccountResponse>('/api/users/me', {
    data: payload ?? {},
  });

  return data;
}

export async function getMyReferrers(): Promise<GetMyReferrersResponse> {
  const { data } = await api.get<GetMyReferrersResponse>(
    '/api/users/me/referrers',
  );

  return data;
}

export async function updateMyReferrers(
  payload: UpdateMyReferrersPayload,
): Promise<UpdateMyReferrersResponse> {
  const { data } = await api.patch<UpdateMyReferrersResponse>(
    '/api/users/me/referrers',
    payload,
  );

  return data;
}
