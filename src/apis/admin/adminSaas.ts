import { api } from '../api';

// ── Types ──────────────────────────────────────────────

export type ApiKeyItem = {
  id: string;
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

export type ApiKeyListResponse = {
  total: number;
  items: ApiKeyItem[];
};

export type ApiKeyCreatePayload = {
  client_name: string;
  allowed_domains?: string[];
  monthly_limit?: number;
  plan?: string;
};

export type ApiKeyUpdatePayload = {
  client_name?: string;
  allowed_domains?: string[];
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

export type UsageStats = {
  total_keys: number;
  active_keys: number;
  total_usage_this_month: number;
  top_clients: {
    client_name: string;
    api_key: string;
    usage: number;
    limit: number;
    plan: string;
    is_active: boolean;
    usage_percent: number;
  }[];
};

// ── API 함수 ────────────────────────────────────────────

export async function fetchSaasKeys(params?: {
  page?: number;
  size?: number;
  search?: string;
  is_active?: boolean;
}): Promise<ApiKeyListResponse> {
  const { data } = await api.get('/api/admin/saas/keys', { params });
  return data;
}

export async function fetchSaasKey(keyId: string): Promise<ApiKeyItem> {
  const { data } = await api.get(`/api/admin/saas/keys/${keyId}`);
  return data;
}

export async function createSaasKey(
  payload: ApiKeyCreatePayload,
): Promise<ApiKeyItem> {
  const { data } = await api.post('/api/admin/saas/keys', payload);
  return data;
}

export async function updateSaasKey(
  keyId: string,
  payload: ApiKeyUpdatePayload,
): Promise<ApiKeyItem> {
  const { data } = await api.put(`/api/admin/saas/keys/${keyId}`, payload);
  return data;
}

export async function rotateSecretKey(keyId: string): Promise<ApiKeyItem> {
  const { data } = await api.post(
    `/api/admin/saas/keys/${keyId}/rotate-secret`,
  );
  return data;
}

export async function resetKeyUsage(
  keyId: string,
): Promise<{ status: string; message: string }> {
  const { data } = await api.post(`/api/admin/saas/keys/${keyId}/reset-usage`);
  return data;
}

export async function fetchKeyUsageLogs(
  keyId: string,
  params?: { page?: number; size?: number },
): Promise<UsageLogListResponse> {
  const { data } = await api.get(`/api/admin/saas/keys/${keyId}/logs`, {
    params,
  });
  return data;
}

export async function fetchSaasStats(): Promise<UsageStats> {
  const { data } = await api.get('/api/admin/saas/stats');
  return data;
}

// ── 플랜 문의 관리 ────────────────────────────────────

export type PlanInquiryItem = {
  id: string;
  user_id: string;
  user_email: string | null;
  desired_plan: string;
  message: string | null;
  status: string;
  created_at: string | null;
};

export type PlanInquiryListResponse = {
  total: number;
  items: PlanInquiryItem[];
};

export async function fetchPlanInquiries(params?: {
  status?: string;
  page?: number;
  size?: number;
}): Promise<PlanInquiryListResponse> {
  const { data } = await api.get('/api/admin/saas/plan-inquiries', { params });
  return data;
}

export async function updatePlanInquiryStatus(
  inquiryId: string,
  status: string,
): Promise<PlanInquiryItem> {
  const { data } = await api.put(
    `/api/admin/saas/plan-inquiries/${inquiryId}`,
    {
      status,
    },
  );
  return data;
}
