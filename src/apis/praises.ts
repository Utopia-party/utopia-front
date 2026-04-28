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

export type PraiseDirection = 'received' | 'sent';

export type MyPraiseItem = {
  id: string;
  from_user_id: string;
  from_nickname: string | null;
  from_profile_image: string | null;
  to_user_id: string;
  to_nickname: string | null;
  to_profile_image: string | null;
  praise_type: PraiseType | string;
  message: string | null;
  created_at: string;
};

export type MyPraisesResponse = {
  items: MyPraiseItem[];
  total: number;
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

export const getMyPraises = async (direction: PraiseDirection) => {
  const { data } = await api.get<MyPraisesResponse>('/api/praises/me', {
    params: { direction },
  });

  return data;
};

export type DeletePraiseResponse = {
  deleted: boolean;
  praise_id: string;
};

export const deletePraise = async (praiseId: string) => {
  const { data } = await api.delete<DeletePraiseResponse>(
    `/api/praises/${praiseId}`,
  );

  return data;
};
