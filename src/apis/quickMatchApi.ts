import { api } from './api';
import type {
  QuickMatchCreatePayload,
  QuickMatchCreateResponse,
  QuickMatchDetailResponse,
  PaymentPreviewResponse,
} from '../types/quickMatch';

export const requestQuickMatch = async (
  payload: QuickMatchCreatePayload,
): Promise<QuickMatchCreateResponse> => {
  const { data } = await api.post('/api/quick-match', payload);
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

export const getPaymentPreview = async (
  partyId: string,
): Promise<PaymentPreviewResponse> => {
  const { data } = await api.get(`/api/payments/preview?party_id=${partyId}`);
  return data;
};
