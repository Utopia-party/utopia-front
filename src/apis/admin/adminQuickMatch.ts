import type {
  AdminQuickMatchActionResponse,
  AdminQuickMatchDetailResponse,
  AdminQuickMatchListParams,
  AdminQuickMatchListResponse,
  AdminQuickMatchSummary,
  QuickMatchQualityResponse,
  TrainingEventListParams,
  TrainingEventListResponse,
  TrainingStatsResponse,
} from '../../types/admin/adminQuickMatch';

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
    let message = errorText || `API 요청 실패: ${res.status}`;

    try {
      const parsed = JSON.parse(errorText) as {
        detail?: string;
        message?: string;
      };
      message = parsed.detail || parsed.message || message;
    } catch {
      // Plain text error body.
    }

    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (value === 'all') return;

    const normalizedValue =
      key === 'status' ? String(value).toUpperCase() : String(value);
    searchParams.set(key, normalizedValue);
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getAdminQuickMatchSummary() {
  return request<AdminQuickMatchSummary>('/api/admin/quick-match/summary');
}

export async function getAdminQuickMatchRequests(
  params: AdminQuickMatchListParams,
) {
  return request<AdminQuickMatchListResponse>(
    `/api/admin/quick-match/requests${buildQuery(params)}`,
  );
}

export async function getAdminQuickMatchRequestDetail(requestId: string) {
  return request<AdminQuickMatchDetailResponse>(
    `/api/admin/quick-match/requests/${requestId}`,
  );
}

export async function getAdminQuickMatchTrainingEvents(
  params: TrainingEventListParams,
) {
  return request<TrainingEventListResponse>(
    `/api/admin/quick-match/training-events${buildQuery(params)}`,
  );
}

export async function getAdminQuickMatchTrainingStats(statType = 'all') {
  return request<TrainingStatsResponse>(
    `/api/admin/quick-match/training-stats${buildQuery({ statType })}`,
  );
}

export async function getAdminQuickMatchQuality() {
  return request<QuickMatchQualityResponse>('/api/admin/quick-match/quality');
}

export async function rebuildAdminQuickMatchTrainingStats() {
  return request<AdminQuickMatchActionResponse>(
    '/api/admin/quick-match/training-stats/rebuild',
    { method: 'POST' },
  );
}

export async function runAdminQuickMatchTrainingLabel(retentionDays = 30) {
  return request<AdminQuickMatchActionResponse>(
    `/api/admin/quick-match/training-label/run${buildQuery({ retentionDays })}`,
    { method: 'POST' },
  );
}

export async function retryAdminQuickMatchRequest(requestId: string) {
  return request<AdminQuickMatchActionResponse>(
    `/api/admin/quick-match/requests/${requestId}/retry`,
    { method: 'POST' },
  );
}

export async function forceFailAdminQuickMatchRequest(
  requestId: string,
  reason = 'ADMIN_FORCE_FAILED',
) {
  return request<AdminQuickMatchActionResponse>(
    `/api/admin/quick-match/requests/${requestId}/force-fail${buildQuery({ reason })}`,
    { method: 'POST' },
  );
}
