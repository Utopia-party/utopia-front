import type {
  AdminQuickMatchActionResponse,
  AdminQuickMatchListParams,
  AdminQuickMatchListResponse,
  AdminQuickMatchPolicyResponse,
  QuickMatchRequestRow,
  UpdateQuickMatchPolicyRequest,
} from '../../types/admin/admin-quick-match';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `API 요청 실패: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

function buildQuery(params: AdminQuickMatchListParams) {
  const searchParams = new URLSearchParams();

  if (params.keyword) searchParams.set('keyword', params.keyword);
  if (params.status && params.status !== '전체') {
    searchParams.set('status', params.status);
  }
  if (params.serviceName && params.serviceName !== '전체') {
    searchParams.set('serviceName', params.serviceName);
  }
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getAdminQuickMatchRequests(
  params: AdminQuickMatchListParams,
) {
  return request<AdminQuickMatchListResponse>(
    `/api/admin/quick-match/requests${buildQuery(params)}`,
  );
}

export async function getAdminQuickMatchRequestDetail(requestId: string) {
  return request<QuickMatchRequestRow>(
    `/api/admin/quick-match/requests/${requestId}`,
  );
}

export async function getAdminQuickMatchPolicy() {
  return request<AdminQuickMatchPolicyResponse>(
    '/api/admin/quick-match/policy',
  );
}

export async function updateAdminQuickMatchPolicy(
  body: UpdateQuickMatchPolicyRequest,
) {
  return request<AdminQuickMatchPolicyResponse>(
    '/api/admin/quick-match/policy',
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
}

export async function retryAdminQuickMatchRequest(requestId: string) {
  return request<AdminQuickMatchActionResponse>(
    `/api/admin/quick-match/requests/${requestId}/retry`,
    { method: 'POST' },
  );
}

export async function forceFailAdminQuickMatchRequest(requestId: string) {
  return request<AdminQuickMatchActionResponse>(
    `/api/admin/quick-match/requests/${requestId}/force-fail`,
    { method: 'POST' },
  );
}

export async function regenerateUserQuickMatchEmbedding(userId: string) {
  return request<AdminQuickMatchActionResponse>(
    `/api/admin/quick-match/users/${userId}/embedding/regenerate`,
    { method: 'POST' },
  );
}

export async function regeneratePartyQuickMatchEmbedding(partyId: string) {
  return request<AdminQuickMatchActionResponse>(
    `/api/admin/quick-match/parties/${partyId}/embedding/regenerate`,
    { method: 'POST' },
  );
}

export async function runQuickMatchEmbeddingBackfill() {
  return request<AdminQuickMatchActionResponse>(
    '/api/admin/quick-match/embedding-backfill',
    { method: 'POST' },
  );
}
