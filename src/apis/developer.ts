import { api } from './api';

// ── Types ──────────────────────────────────────────────

export type MyApiKey = {
  id: string;
  client_name: string;
  api_key: string;
  secret_key: string; // masked except on create/rotate
  allowed_domains: string[] | null;
  monthly_limit: number;
  current_month_usage: number;
  plan: string;
  is_active: boolean;
  created_at: string | null;
};

export type ApiKeyListResponse = {
  total: number;
  items: MyApiKey[];
};

export type ApiKeyCreatePayload = {
  client_name: string;
  allowed_domains?: string[];
};

export type ApiKeyUpdatePayload = {
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

// ── API 함수 ────────────────────────────────────────────

export async function fetchMyKeys(params?: {
  page?: number;
  size?: number;
}): Promise<ApiKeyListResponse> {
  const { data } = await api.get('/api/developer/keys', { params });
  return data;
}

export async function fetchMyKey(keyId: string): Promise<MyApiKey> {
  const { data } = await api.get(`/api/developer/keys/${keyId}`);
  return data;
}

export async function createMyKey(
  payload: ApiKeyCreatePayload,
): Promise<MyApiKey> {
  const { data } = await api.post('/api/developer/keys', payload);
  return data;
}

export async function updateMyKey(
  keyId: string,
  payload: ApiKeyUpdatePayload,
): Promise<MyApiKey> {
  const { data } = await api.put(`/api/developer/keys/${keyId}`, payload);
  return data;
}

// deleteMyKey 제거됨 — 관리자 전용으로 이관 (adminSaas.ts)

export async function rotateMySecret(keyId: string): Promise<MyApiKey> {
  const { data } = await api.post(`/api/developer/keys/${keyId}/rotate-secret`);
  return data;
}

export async function fetchMyUsageLogs(
  keyId: string,
  params?: {
    page?: number;
    size?: number;
  },
): Promise<UsageLogListResponse> {
  const { data } = await api.get(`/api/developer/keys/${keyId}/usage`, {
    params,
  });
  return data;
}

export async function fetchMyUsageSummary(): Promise<UsageSummary> {
  const { data } = await api.get('/api/developer/usage-summary');
  return data;
}

// ── 플랜 문의 ─────────────────────────────────────────

export type PlanInquiry = {
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
  items: PlanInquiry[];
};

export type PlanInquiryCreatePayload = {
  desired_plan: string;
  message?: string;
};

export async function createPlanInquiry(
  payload: PlanInquiryCreatePayload,
): Promise<PlanInquiry> {
  const { data } = await api.post('/api/developer/plan-inquiry', payload);
  return data;
}

export async function fetchMyPlanInquiries(): Promise<PlanInquiryListResponse> {
  const { data } = await api.get('/api/developer/plan-inquiries');
  return data;
}
