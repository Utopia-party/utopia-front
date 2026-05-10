import { api } from '../api';

export type ServiceType = 'captcha_l2' | 'chat_filter';

export type SaasKeyItem = {
  id: string;
  service_type: ServiceType;
  client_name: string;
  api_key: string;
  secret_key: string;
  allowed_domains: string[] | null;
  monthly_limit: number;
  current_month_usage: number;
  plan: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type SaasKeyListResponse = {
  total: number;
  items: SaasKeyItem[];
};

export type SaasKeyCreatePayload = {
  service_type: ServiceType;
  client_name: string;
  allowed_domains?: string[];
  monthly_limit?: number;
  plan?: string;
};

export type SaasKeyUpdatePayload = {
  client_name?: string;
  allowed_domains?: string[]
  monthly_limit?: number;
  plan?: string;
  is_active?: boolean;
};

export type UsageLogItem = {
  id: string;
  endpoint: string;
  client_ip: string | null;
  origin_domain: string | null;
  status_code: number;
  response_time_ms: number;
  created_at: string | null;
};

export type UsageLogListResponse = {
  total: number;
  items: UsageLogItem[];
};

export type SaasStats = {
  total_keys: number;
  active_keys: number;
  total_usage_this_month: number;
  top_clients: {
    client_name: string;
    api_key: string;
    service_type: ServiceType;
    usage: number;
    limit: number;
    plan: string;
    is_active: boolean;
    usage_percent: number;
  }[];
};

const BASE = '/api/admin/saas-v2';

export async function fetchSaasV2Keys(params?: {
  page?: number;
  size?: number;
  service_type?: ServiceType;
  search?: string;
  is_active?: boolean;
}): Promise<SaasKeyListResponse> {
  const { data } = await api.get(`${BASE}/keys`, { params });
  return data;
}

export async function fetchSaasV2Key(keyId: string): Promise<SaasKeyItem> {
  const { data } = await api.get(`${BASE}/keys/${keyId}`);
  return data;
}

export async function createSaasV2Key(
  payload: SaasKeyCreatePayload,
): Promise<SaasKeyItem> {
  const { data } = await api.post(`${BASE}/keys`, payload);
  return data;
}

export async function updateSaasV2Key(
  keyId: string,
  payload: SaasKeyUpdatePayload,
): Promise<SaasKeyItem> {
  const { data } = await api.put(`${BASE}/keys/${keyId}`, payload);
  return data;
}

export async function rotateSaasV2Secret(keyId: string): Promise<SaasKeyItem> {
  const { data } = await api.post(`${BASE}/keys/${keyId}/rotate-secret`);
  return data;
}

export async function resetSaasV2Usage(keyId: string): Promise<{ status: string }> {
  const { data } = await api.post(`${BASE}/keys/${keyId}/reset-usage`);
  return data;
}

export async function fetchSaasV2Logs(
  keyId: string,
  params?: { page?: number; size?: number },
): Promise<UsageLogListResponse> {
  const { data } = await api.get(`${BASE}/keys/${keyId}/logs`, { params });
  return data;
}

export async function fetchSaasV2Stats(
  serviceType?: ServiceType,
): Promise<SaasStats> {
  const { data } = await api.get(`${BASE}/stats`, {
    params: serviceType ? { service_type: serviceType } : undefined,
  });
  return data;
}
