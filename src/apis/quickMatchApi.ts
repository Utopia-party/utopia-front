import { api } from './api';
import type {
  QuickMatchCreatePayload,
  QuickMatchCreateResponse,
  QuickMatchCandidate,
  QuickMatchResultResponse,
  QuickMatchDetailResponse,
} from '../types/quickMatch';

export const requestQuickMatch = async (
  payload: QuickMatchCreatePayload,
): Promise<QuickMatchCreateResponse> => {
  const { data } = await api.post('/api/quick-match', payload);
  return data;
};

export const generateQuickMatchCandidates = async (
  requestId: string,
): Promise<QuickMatchCandidate[]> => {
  const { data } = await api.post(`/api/quick-match/${requestId}/candidates`);
  return data;
};

export const selectQuickMatchParty = async (
  requestId: string,
): Promise<QuickMatchResultResponse> => {
  const { data } = await api.post(`/api/quick-match/${requestId}/select`);
  return data;
};

export const joinQuickMatchParty = async (
  requestId: string,
): Promise<{
  party_member_id: string;
  party_id: string;
  user_id: string;
  status: string;
  join_type: string;
  current_members: number;
}> => {
  const { data } = await api.post(`/api/quick-match/${requestId}/join`);
  return data;
};

export const getQuickMatchDetail = async (
  requestId: string,
): Promise<QuickMatchDetailResponse> => {
  const { data } = await api.get(`/api/quick-match/${requestId}`);
  return data;
};
