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

export type AdminServiceCreatePayload = AdminServiceUpdatePayload & {
  name: string;
  category: string;
};

export type AdminServiceLogoUploadResponse = {
  logoImageKey: string;
  logoImageUrl: string;
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

export async function createAdminService(
  payload: AdminServiceCreatePayload,
): Promise<AdminServiceRecord> {
  const { data } = await api.post<AdminServiceRecord>(
    '/api/admin/services',
    payload,
  );
  return data;
}

export async function deleteAdminService(serviceId: string): Promise<void> {
  await api.delete(`/api/admin/services/${serviceId}`);
}

export async function uploadAdminServiceLogo(
  file: File,
): Promise<AdminServiceLogoUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<AdminServiceLogoUploadResponse>(
    '/api/admin/services/logo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return data;
}
