import { api } from './api';

import type {
  MyPaymentItem,
  GetMyPaymentsResponse,
  GetMyProfileResponse,
  UpdateMyProfilePayload,
  UpdateMyProfileResponse,
  GetMyTrustHistoryResponse,
  DeleteMyAccountPayload,
  DeleteMyAccountResponse,
  GetMyReferrersResponse,
  UpdateMyReferrersPayload,
  UpdateMyReferrersResponse,
} from '../types/user';

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
