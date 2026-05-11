import { api } from '../api';

export type AppealStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AppealOut = {
  id: string;
  user_id: string;
  ban_type: string;
  ban_reference_id: string | null;
  reason: string;
  status: AppealStatus;
  admin_memo: string | null;
  created_at: string;
};

export type AdminAppealOut = AppealOut & {
  user_nickname: string;
  user_email: string;
  reviewed_by_nickname: string | null;
  reviewed_at: string | null;
  ban_detail: string | null;
  ban_score_change: number | null;
  ban_created_at: string | null;
  ip_address: string | null;
};

// 유저: 이의제기 신청
export async function submitAppeal(payload: {
  ban_type: string;
  ban_reference_id?: string | null;
  reason: string;
}): Promise<AppealOut> {
  const { data } = await api.post<AppealOut>('/api/appeals', payload);
  return data;
}

// 유저: 내 이의제기 목록
export async function fetchMyAppeals(): Promise<AppealOut[]> {
  const { data } = await api.get<AppealOut[]>('/api/appeals/my');
  return data;
}

// 관리자: 이의제기 목록
export async function fetchAdminAppeals(
  status?: string,
): Promise<AdminAppealOut[]> {
  const params = status ? { status } : {};
  const { data } = await api.get<AdminAppealOut[]>('/api/admin/appeals', {
    params,
  });
  return data;
}

// 관리자: 이의제기 처리
export async function reviewAppeal(
  appealId: string,
  payload: { status: 'APPROVED' | 'REJECTED'; admin_memo?: string },
): Promise<AdminAppealOut> {
  const { data } = await api.patch<AdminAppealOut>(
    `/api/admin/appeals/${appealId}`,
    payload,
  );
  return data;
}
