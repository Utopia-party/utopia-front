import { api } from './api';
import type { MyPartyListResponse, PartyMembersResponse } from '../types/party';

// 내 파티 목록 (리더 + 참여중)
export async function getMyParties(): Promise<MyPartyListResponse> {
  const { data } = await api.get<MyPartyListResponse>('/api/users/me/parties');
  return data;
}

// 파티 멤버 목록 (강퇴/리더 위임 모달용)
export async function getPartyMembers(
  partyId: string,
): Promise<PartyMembersResponse> {
  const { data } = await api.get<PartyMembersResponse>(
    `/api/parties/${partyId}/members`,
  );
  return data;
}

// 파티 탈퇴 (리더는 위임 후에만 가능)
export async function leaveParty(
  partyId: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    `/api/parties/${partyId}/leave`,
  );
  return data;
}

// 참여자 강퇴 (리더만)
export async function kickMember(
  partyId: string,
  userId: string,
): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(
    `/api/parties/${partyId}/members/${userId}`,
  );
  return data;
}

// 리더 위임 (리더만)
export async function transferLeader(
  partyId: string,
  newLeaderUserId: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    `/api/parties/${partyId}/transfer-leader`,
    { new_leader_user_id: newLeaderUserId },
  );
  return data;
}
