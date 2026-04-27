import { api } from './api';

export type PraiseType =
  | 'kind'
  | 'fast_response'
  | 'responsible'
  | 'good_mood'
  | 'custom';

export type CreatePraisePayload = {
  to_user_id: string;
  praise_type: PraiseType;
  message?: string | null;
  party_id?: string;
};

export type PraiseResponse = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  praise_type: PraiseType | string;
  message: string | null;
  created_at: string;
};

export type PraiseAvailabilityResponse = {
  can_praise: boolean;
  last_praised_at: string | null;
  next_available_at: string | null;
  remaining_days: number;
};

export const createPraise = async (payload: CreatePraisePayload) => {
  const { data } = await api.post<PraiseResponse>('/api/praises', payload);
  return data;
};

export const getPraiseAvailability = async (
  toUserId: string,
  partyId?: string,
) => {
  const { data } = await api.get<PraiseAvailabilityResponse>(
    `/api/praises/availability/${toUserId}`,
    {
      params: partyId ? { party_id: partyId } : undefined,
    },
  );

  return data;
};
