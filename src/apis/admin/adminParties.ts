import { api } from '../api';

export type AdminPartyRecord = {
  id: string;
  title: string;
  createdAt: string;
  service: string;
  category: string;
  leaderId: string;
  leaderNickname: string;
  memberCount: number;
  status: '운영중' | '모집중' | '위험' | '종료됨';
  reportCount: number;
  monthlyAmount: number;
  lastPayment: string;
};

export type AdminPartyMember = {
  memberId: string;
  userId: string;
  nickname: string;
  name?: string | null;
  role: 'leader' | 'member';
  status: 'active' | 'kicked' | 'left';
  joinedAt: string;
  leftAt?: string | null;
  trustScore: number;
};

export async function fetchAdminParties(params?: {
  keyword?: string;
  status?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
}): Promise<AdminPartyRecord[]> {
  const { data } = await api.get<AdminPartyRecord[]>('/api/admin/parties', {
    params,
  });
  return data;
}

export async function forceEndAdminParty(
  partyId: string,
  reason?: string,
): Promise<AdminPartyRecord> {
  const { data } = await api.post<AdminPartyRecord>(
    `/api/admin/parties/${partyId}/force-end`,
    { reason },
  );
  return data;
}

export async function fetchAdminPartyMembers(
  partyId: string,
): Promise<AdminPartyMember[]> {
  const { data } = await api.get<AdminPartyMember[]>(
    `/api/admin/parties/${partyId}/members`,
  );
  return data;
}

export async function kickAdminPartyMember(
  partyId: string,
  userId: string,
  reason?: string,
): Promise<AdminPartyMember> {
  const { data } = await api.post<AdminPartyMember>(
    `/api/admin/parties/${partyId}/members/${userId}/kick`,
    { reason },
  );
  return data;
}

export async function changeAdminPartyMemberRole(
  partyId: string,
  userId: string,
  role: 'leader' | 'member',
): Promise<AdminPartyMember> {
  const { data } = await api.patch<AdminPartyMember>(
    `/api/admin/parties/${partyId}/members/${userId}/role`,
    { role },
  );
  return data;
}
