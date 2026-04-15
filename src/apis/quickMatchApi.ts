import { api } from './api';

export interface QuickMatchRequest {
  service_id: string;
  preferred_conditions?: {
    estimated_price?: string;
    preferred_time?: string;
  };
}

export interface QuickMatchResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export const requestQuickMatch = async (
  payload: QuickMatchRequest,
): Promise<QuickMatchResponse> => {
  const { data } = await api.post('/api/quick-match', payload);
  return data;
};
