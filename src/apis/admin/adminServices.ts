import { api } from '../api';

export type AdminServiceRecord = {
  id: string;
  name: string;
  category: string;
  maxMembers: number;
  monthlyPrice: number;
  originalPrice: number;
  logoImageKey?: string | null;
  logoImageUrl?: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  commissionRate: number;
  leaderDiscountRate: number;
  referralDiscountRate: number;
  quickMatchFeeRate: number;
};

export type AdminServiceUpdatePayload = {
  maxMembers: number;
  monthlyPrice: number;
  originalPrice: number;
  logoImageKey?: string | null;
  isActive: boolean;
  commissionRate: number;
  leaderDiscountRate: number;
  referralDiscountRate: number;
  quickMatchFeeRate: number;
};

export async function fetchAdminServices(): Promise<AdminServiceRecord[]> {
  const { data } = await api.get<AdminServiceRecord[]>('/api/admin/services');
  return data;
}

export async function updateAdminService(
  serviceId: string,
  payload: AdminServiceUpdatePayload,
): Promise<AdminServiceRecord> {
  const { data } = await api.patch<AdminServiceRecord>(
    `/api/admin/services/${serviceId}`,
    payload,
  );
  return data;
}
