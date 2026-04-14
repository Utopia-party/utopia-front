import { api } from '../apis/api';
import type { PartyListResponse, Party, Category } from '../types/party';

export const partyKeys = {
  all: ['parties'] as const,
  list: (category: string | null, search: string, refreshKey?: number) =>
    ['parties', 'list', category, search, refreshKey ?? 0] as const,
  detail: (id: string) => ['parties', id] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
};

export const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get('/api/parties/categories');
  return data;
};

export const fetchParties = async (params: {
  category_name?: string;
  service_id?: string;
  search?: string;
  page?: number;
  size?: number;
}): Promise<PartyListResponse> => {
  const { data } = await api.get('/api/parties', { params });
  return data;
};

export const fetchParty = async (id: string): Promise<Party> => {
  const { data } = await api.get(`/api/parties/${id}`);
  return data;
};

export const applyParty = async (
  partyId: string,
): Promise<{ message: string }> => {
  const { data } = await api.post(`/api/parties/${partyId}/join`);
  return data;
};
