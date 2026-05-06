import { api } from '../api';

export type AdminChatFlagged = {
  id: string;
  partyId: string;
  partyTitle: string;
  senderId: string;
  senderNickname: string;
  message: string;
  flagReason?: string | null;
  flagConfidence?: number | null;
  flagStage?: number | null;
  moderationStatus?: string | null;
  isDeleted: boolean;
  createdAt: string;
  warnCount?: number | null;
};

export type AdminModerationStat = {
  totalFlagged: number;
  blocked: number;
  warned: number;
  falsePositive: number;
  pending: number;
  detectionRate: number;
};

export type ModerationTrendPoint = {
  date: string;
  blocked: number;
  warned: number;
  false_positive: number;
  total: number;
};

export async function fetchAdminFlaggedChats(params?: {
  party_id?: string;
  moderation_status?: string;
  date_from?: string;
  date_to?: string;
  keyword?: string;
}): Promise<AdminChatFlagged[]> {
  const { data } = await api.get<AdminChatFlagged[]>(
    '/api/admin/moderation/chat-logs',
    { params },
  );
  return data;
}

export async function updateAdminChatModerationStatus(
  chatId: string,
  status: 'blocked' | 'warned' | 'false_positive' | 'pending',
): Promise<{ id: string; moderationStatus: string }> {
  const { data } = await api.patch<{ id: string; moderationStatus: string }>(
    `/api/admin/moderation/chat-logs/${chatId}/status`,
    null,
    { params: { status } },
  );
  return data;
}

export async function fetchAdminModerationStats(params?: {
  date_from?: string;
  date_to?: string;
}): Promise<AdminModerationStat> {
  const { data } = await api.get<AdminModerationStat>(
    '/api/admin/moderation/chat-stats',
    { params },
  );
  return data;
}

export async function fetchModerationTrend(params?: {
  period?: 'daily' | 'weekly' | 'monthly';
  start_date?: string;
  end_date?: string;
}): Promise<ModerationTrendPoint[]> {
  const { data } = await api.get<ModerationTrendPoint[]>(
    '/api/admin/moderation/chat-trend',
    { params },
  );
  return data;
}
