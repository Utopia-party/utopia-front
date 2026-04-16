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

// 파티 참여 신청 (status='pending'으로 생성, 리더 승인 필요)
export async function applyToParty(
  partyId: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    `/api/parties/${partyId}/join`,
  );
  return data;
}

// 대기 중 신청자 목록 조회 (리더 전용)
export async function getPartyApplications(
  partyId: string,
): Promise<PartyMembersResponse> {
  const { data } = await api.get<PartyMembersResponse>(
    `/api/parties/${partyId}/applications`,
  );
  return data;
}

// 참여 신청 승인 (리더 전용)
export async function approveApplication(
  partyId: string,
  userId: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    `/api/parties/${partyId}/applications/${userId}/approve`,
  );
  return data;
}

// 참여 신청 거절 (리더 전용)
export async function rejectApplication(
  partyId: string,
  userId: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    `/api/parties/${partyId}/applications/${userId}/reject`,
  );
  return data;
}
