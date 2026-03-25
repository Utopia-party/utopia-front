import { api } from './api';
import type { PartyListResponse, Party, SystemNotification, Category } from '../types/party';

export const partyKeys = {
  all: ['parties'] as const,
  list: (categoryId: number | null, search: string) =>
    ['parties', 'list', categoryId, search] as const,
  detail: (id: number) => ['parties', id] as const,
};

export const notificationKeys = {
  latest: ['notifications', 'latest'] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
};

export const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get('/parties/categories');
  return data;
};

export const fetchParties = async (params: {
  category_id?: number;
  search?: string;
  page?: number;
  size?: number;
}): Promise<PartyListResponse> => {
  const { data } = await api.get('/parties', { params });
  return data;
};

export const fetchParty = async (id: number): Promise<Party> => {
  const { data } = await api.get(`/parties/${id}`);
  return data;
};

export const applyParty = async (partyId: number): Promise<{ message: string }> => {
  const { data } = await api.post(`/parties/${partyId}/join`);
  return data;
};

export const fetchLatestNotifications = async (): Promise<SystemNotification[]> => {
  const { data } = await api.get('/notifications/latest');
  return data;
};
