import { api } from '../apis/api';
import type { PartyListResponse, Party, Category } from '../types/party';

export const partyKeys = {
  all: ['parties'] as const,
  // ✅ Fix: categoryId가 이제 카테고리 이름 문자열 (ex: "OTT", "생산성")
  list: (category: string | null, search: string) =>
    ['parties', 'list', category, search] as const,
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
  category?: string;
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
