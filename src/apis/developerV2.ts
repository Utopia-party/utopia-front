import { api } from './api';

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
};

export type SaasKeyListResponse = {
  total: number;
  items: SaasKeyItem[];
};

export type SaasKeyCreatePayload = {
  service_type: ServiceType;
  client_name: string;
  allowed_domains?: string[];
};

export type SaasKeyUpdatePayload = {
  client_name?: string;
  allowed_domains?: string[];
};

export type UsageLogItem = {
  id: string;
  endpoint: string;
  status_code: number;
  response_time_ms: number | null;
  created_at: string | null;
};

export type UsageLogListResponse = {
  total: number;
  items: UsageLogItem[];
};

export type UsageSummary = {
  total_keys: number;
  active_keys: number;
  total_usage_this_month: number;
};

// ── 키 목록
export async function fetchMyV2Keys(params?: {
  service_type?: ServiceType;
  page?: number;
  size?: number;
}): Promise<SaasKeyListResponse> {
  const { data } = await api.get('/api/developer-v2/keys', { params });
  return data;
}

// ── 키 발급
export async function createMyV2Key(
  payload: SaasKeyCreatePayload,
): Promise<SaasKeyItem> {
  const { data } = await api.post('/api/developer-v2/keys', payload);
  return data;
}

// ── 키 수정
export async function updateMyV2Key(
  keyId: string,
  payload: SaasKeyUpdatePayload,
): Promise<SaasKeyItem> {
  const { data } = await api.put(`/api/developer-v2/keys/${keyId}`, payload);
  return data;
}

// ── 키 삭제
export async function deleteMyV2Key(keyId: string): Promise<void> {
  await api.delete(`/api/developer-v2/keys/${keyId}`);
}

// ── Secret 재발급
export async function rotateMyV2Secret(keyId: string): Promise<SaasKeyItem> {
  const { data } = await api.post(`/api/developer-v2/keys/${keyId}/rotate-secret`);
  return data;
}

// ── 사용 로그
export async function fetchMyV2UsageLogs(
  keyId: string,
  params?: { page?: number; size?: number },
): Promise<UsageLogListResponse> {
  const { data } = await api.get(`/api/developer-v2/keys/${keyId}/usage`, { params });
  return data;
}

// ── 사용량 요약
export async function fetchMyV2UsageSummary(
  serviceType?: ServiceType,
): Promise<UsageSummary> {
  const { data } = await api.get('/api/developer-v2/usage-summary', {
    params: serviceType ? { service_type: serviceType } : undefined,
  });
  return data;
}
