import axios from 'axios';
import { api } from '../api';

import type {
  AdminUserDetail,
  AdminUserListParams,
  AdminUserRecord,
  AdminUserRecommenderUpdatePayload,
  AdminUserStatusLog,
  AdminUserStatusUpdatePayload,
  AdminUserTrustScoreUpdatePayload,
} from '../../types/admin/adminUser';

export async function fetchAdminUsers(
  params?: AdminUserListParams,
): Promise<AdminUserRecord[]> {
  const { data } = await api.get<AdminUserRecord[]>('/api/admin/users', {
    params,
  });

  return data;
}

export async function fetchAdminUserDetail(
  userId: string,
): Promise<AdminUserDetail> {
  const { data } = await api.get<AdminUserDetail>(`/api/admin/users/${userId}`);

  return data;
}

export async function updateAdminUserStatus(
  userId: string,
  payload: AdminUserStatusUpdatePayload,
): Promise<AdminUserRecord> {
  const { data } = await api.patch<AdminUserRecord>(
    `/api/admin/users/${userId}/status`,
    payload,
  );

  return data;
}

export async function updateAdminUserTrustScore(
  userId: string,
  payload: AdminUserTrustScoreUpdatePayload,
): Promise<AdminUserDetail> {
  const { data } = await api.patch<AdminUserDetail>(
    `/api/admin/users/${userId}/trust-score`,
    payload,
  );

  return data;
}

export async function updateAdminUserRecommender(
  userId: string,
  payload: AdminUserRecommenderUpdatePayload,
): Promise<AdminUserDetail> {
  const { data } = await api.patch<AdminUserDetail>(
    `/api/admin/users/${userId}/recommender`,
    payload,
  );

  return data;
}

export async function fetchAdminUserStatusLogs(
  userId: string,
): Promise<AdminUserStatusLog[]> {
  const { data } = await api.get<AdminUserStatusLog[]>(
    `/api/admin/users/${userId}/status-logs`,
  );

  return data;
}

export function getAdminUserErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join(', ');
    }

    return (
      detail ||
      error.response?.data?.message ||
      error.message ||
      '사용자 관리 요청 처리 중 오류가 발생했습니다.'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '사용자 관리 요청 처리 중 오류가 발생했습니다.';
}
