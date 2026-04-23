// ================================
// HandOCR Admin
// ================================

export interface AdminHandOcrQuery {
  keyword?: string;
  date_from?: string;
  date_to?: string;
  error_code?: string;
  pose?: string;
  status_tab?: string;
  page?: number;
  page_size?: number;
}

export interface AdminHandOcrHealthApiResponse {
  ok: boolean;
  service: string;
  pose_model_loaded: boolean;
  ocr_loaded: boolean;
  paddle_cuda_available: boolean;
  paddle_device: string;
  ocr_use_gpu: boolean;
}

export interface AdminHandOcrHealth {
  ok: boolean;
  service: string;
  poseModelLoaded: boolean;
  ocrLoaded: boolean;
  paddleCudaAvailable: boolean;
  paddleDevice: string;
  ocrUseGpu: boolean;
}

export interface AdminHandOcrRecordApiResponse {
  session_id?: string;
  sessionId?: string;
  request_id?: string | null;
  requestId?: string | null;
  created_at?: string;
  createdAt?: string;

  verify_success?: boolean;
  verifySuccess?: boolean;

  expected_pose?: string;
  expectedPose?: string;
  detected_pose?: string | null;
  detectedPose?: string | null;

  expected_text?: string;
  expectedText?: string;
  detected_text?: string | null;
  detectedText?: string | null;

  pose_confidence?: number | null;
  poseConfidence?: number | null;
  ocr_confidence?: number | null;
  ocrConfidence?: number | null;
  ocr_low_confidence?: boolean | null;
  ocrLowConfidence?: boolean | null;

  pose_match?: boolean | null;
  poseMatch?: boolean | null;
  text_match?: boolean | null;
  textMatch?: boolean | null;

  ai_error_code?: string | null;
  aiErrorCode?: string | null;
  ai_message?: string | null;
  aiMessage?: string | null;
  ai_guide?: string | null;
  aiGuide?: string | null;

  image_key?: string | null;
  imageKey?: string | null;
  text_crop_key?: string | null;
  textCropKey?: string | null;

  image_url?: string | null;
  imageUrl?: string | null;
  text_crop_url?: string | null;
  textCropUrl?: string | null;

  ocr_best_attempt?: string | null;
  ocrBestAttempt?: string | null;
  ocr_text_candidates?: unknown;
  ocrTextCandidates?: unknown;

  text_region_bbox?: Record<string, unknown> | null;
  textRegionBbox?: Record<string, unknown> | null;

  inspection?: Record<string, unknown> | null;
}

export interface AdminHandOcrRecord {
  sessionId: string;
  requestId: string | null;
  createdAt: string;

  verifySuccess: boolean;

  expectedPose: string;
  detectedPose: string | null;

  expectedText: string;
  detectedText: string | null;

  poseConfidence: number | null;
  ocrConfidence: number | null;
  ocrLowConfidence: boolean | null;

  poseMatch: boolean | null;
  textMatch: boolean | null;

  aiErrorCode: string | null;
  aiMessage: string | null;
  aiGuide: string | null;

  imageKey: string | null;
  textCropKey: string | null;

  imageUrl: string | null;
  textCropUrl: string | null;

  ocrBestAttempt: string | null;
  ocrTextCandidates: string[];
  textRegionBbox: Record<string, unknown> | null;

  inspection: Record<string, unknown> | null;
}

export interface AdminHandOcrSummaryApiResponse {
  total?: number;
  success?: number;
  failed?: number;
  low_confidence?: number;
  lowConfidence?: number;
  pose_mismatch?: number;
  poseMismatch?: number;
  gpu_error?: number;
  gpuError?: number;
}

export interface AdminHandOcrSummary {
  total: number;
  success: number;
  failed: number;
  lowConfidence: number;
  poseMismatch: number;
  gpuError: number;
}

export interface AdminHandOcrRecordsPageApiResponse {
  items?: AdminHandOcrRecordApiResponse[];
  total_count?: number;
  totalCount?: number;
  page?: number;
  page_size?: number;
  pageSize?: number;
  total_pages?: number;
  totalPages?: number;
  summary?: AdminHandOcrSummaryApiResponse;
}

export interface AdminHandOcrRecordsPage {
  items: AdminHandOcrRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: AdminHandOcrSummary;
}

export interface AdminHandOcrBlockQuery {
  keyword?: string;
  limit?: number;
}

export interface AdminHandOcrBlockApiResponse {
  ip?: string;
  blocked?: boolean;
  reason?: string | null;
  ttl_seconds?: number | null;
  ttlSeconds?: number | null;
}

export interface AdminHandOcrBlockItem {
  ip: string;
  blocked: boolean;
  reason: string | null;
  ttlSeconds: number | null;
}

export interface AdminHandOcrSessionQuery {
  keyword?: string;
  limit?: number;
}

export interface AdminHandOcrSessionApiResponse {
  ip?: string;
  session_id?: string | null;
  sessionId?: string | null;
  active_session_ttl_seconds?: number | null;
  activeSessionTtlSeconds?: number | null;
  session_ttl_seconds?: number | null;
  sessionTtlSeconds?: number | null;
  text?: string | null;
  pose?: string | null;
  attempts?: number | null;
}

export interface AdminHandOcrSessionItem {
  ip: string;
  sessionId: string | null;
  activeSessionTtlSeconds: number | null;
  sessionTtlSeconds: number | null;
  text: string | null;
  pose: string | null;
  attempts: number | null;
}

export interface AdminHandOcrActionResponse {
  success: boolean;
  ip?: string;
  session_id?: string;
  sessionId?: string;
  released?: boolean;
  deleted_key_count?: number;
  deletedKeyCount?: number;
}

const HAND_OCR_ADMIN_ENDPOINTS = {
  records: '/api/admin/handocr/records',
  health: '/api/admin/handocr/health',
  image: '/api/admin/handocr/image',
  blocks: '/api/admin/handocr/blocks',
  sessions: '/api/admin/handocr/sessions',
} as const;

const toNullableString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
};

const toNullableNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
};

const toNullableBoolean = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;
  return null;
};

const toRecordObject = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter((item) => item.length > 0);
      }
    } catch {
      // ignore
    }

    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return [trimmed];
  }

  return [];
};

const buildQueryString = (
  params?: Record<string, string | number | undefined>,
) => {
  const query = new URLSearchParams();

  if (!params) return '';

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

const extractErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
    return fallback;
  } catch {
    return fallback;
  }
};

const fetchJson = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
  });

  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(
        response,
        '관리자 요청 처리 중 오류가 발생했습니다.',
      ),
    );
  }

  return response.json() as Promise<T>;
};

const normalizeAdminHandOcrHealth = (
  item: AdminHandOcrHealthApiResponse,
): AdminHandOcrHealth => ({
  ok: Boolean(item.ok),
  service: item.service ?? 'handocr',
  poseModelLoaded: Boolean(item.pose_model_loaded),
  ocrLoaded: Boolean(item.ocr_loaded),
  paddleCudaAvailable: Boolean(item.paddle_cuda_available),
  paddleDevice: item.paddle_device ?? '-',
  ocrUseGpu: Boolean(item.ocr_use_gpu),
});

const normalizeAdminHandOcrRecord = (
  item: AdminHandOcrRecordApiResponse,
): AdminHandOcrRecord => ({
  sessionId: item.sessionId ?? item.session_id ?? '',
  requestId: item.requestId ?? item.request_id ?? null,
  createdAt: item.createdAt ?? item.created_at ?? '',

  verifySuccess: Boolean(item.verifySuccess ?? item.verify_success),

  expectedPose: item.expectedPose ?? item.expected_pose ?? '-',
  detectedPose: item.detectedPose ?? item.detected_pose ?? null,

  expectedText: item.expectedText ?? item.expected_text ?? '-',
  detectedText: item.detectedText ?? item.detected_text ?? null,

  poseConfidence: toNullableNumber(item.poseConfidence ?? item.pose_confidence),
  ocrConfidence: toNullableNumber(item.ocrConfidence ?? item.ocr_confidence),
  ocrLowConfidence: toNullableBoolean(
    item.ocrLowConfidence ?? item.ocr_low_confidence,
  ),

  poseMatch: toNullableBoolean(item.poseMatch ?? item.pose_match),
  textMatch: toNullableBoolean(item.textMatch ?? item.text_match),

  aiErrorCode: toNullableString(item.aiErrorCode ?? item.ai_error_code),
  aiMessage: toNullableString(item.aiMessage ?? item.ai_message),
  aiGuide: toNullableString(item.aiGuide ?? item.ai_guide),

  imageKey: toNullableString(item.imageKey ?? item.image_key),
  textCropKey: toNullableString(item.textCropKey ?? item.text_crop_key),

  imageUrl: toNullableString(item.imageUrl ?? item.image_url),
  textCropUrl: toNullableString(item.textCropUrl ?? item.text_crop_url),

  ocrBestAttempt: toNullableString(
    item.ocrBestAttempt ?? item.ocr_best_attempt,
  ),
  ocrTextCandidates: toStringArray(
    item.ocrTextCandidates ?? item.ocr_text_candidates,
  ),

  textRegionBbox: toRecordObject(item.textRegionBbox ?? item.text_region_bbox),
  inspection: toRecordObject(item.inspection),
});

const normalizeAdminHandOcrSummary = (
  item?: AdminHandOcrSummaryApiResponse,
): AdminHandOcrSummary => ({
  total: toNullableNumber(item?.total) ?? 0,
  success: toNullableNumber(item?.success) ?? 0,
  failed: toNullableNumber(item?.failed) ?? 0,
  lowConfidence:
    toNullableNumber(item?.lowConfidence ?? item?.low_confidence) ?? 0,
  poseMismatch:
    toNullableNumber(item?.poseMismatch ?? item?.pose_mismatch) ?? 0,
  gpuError: toNullableNumber(item?.gpuError ?? item?.gpu_error) ?? 0,
});

const normalizeAdminHandOcrRecordsPage = (
  item: AdminHandOcrRecordsPageApiResponse,
): AdminHandOcrRecordsPage => ({
  items: Array.isArray(item.items)
    ? item.items.map(normalizeAdminHandOcrRecord)
    : [],
  totalCount: toNullableNumber(item.totalCount ?? item.total_count) ?? 0,
  page: toNullableNumber(item.page) ?? 1,
  pageSize: toNullableNumber(item.pageSize ?? item.page_size) ?? 20,
  totalPages: toNullableNumber(item.totalPages ?? item.total_pages) ?? 1,
  summary: normalizeAdminHandOcrSummary(item.summary),
});

const normalizeAdminHandOcrBlock = (
  item: AdminHandOcrBlockApiResponse,
): AdminHandOcrBlockItem => ({
  ip: item.ip ?? '',
  blocked: Boolean(item.blocked),
  reason: toNullableString(item.reason),
  ttlSeconds: toNullableNumber(item.ttlSeconds ?? item.ttl_seconds),
});

const normalizeAdminHandOcrSession = (
  item: AdminHandOcrSessionApiResponse,
): AdminHandOcrSessionItem => ({
  ip: item.ip ?? '',
  sessionId: item.sessionId ?? item.session_id ?? null,
  activeSessionTtlSeconds: toNullableNumber(
    item.activeSessionTtlSeconds ?? item.active_session_ttl_seconds,
  ),
  sessionTtlSeconds: toNullableNumber(
    item.sessionTtlSeconds ?? item.session_ttl_seconds,
  ),
  text: toNullableString(item.text),
  pose: toNullableString(item.pose),
  attempts: toNullableNumber(item.attempts),
});

export async function fetchAdminHandOcrRecords(
  params?: AdminHandOcrQuery,
): Promise<AdminHandOcrRecordsPage> {
  const queryString = buildQueryString({
    keyword: params?.keyword,
    date_from: params?.date_from,
    date_to: params?.date_to,
    error_code: params?.error_code,
    pose: params?.pose,
    status_tab: params?.status_tab,
    page: params?.page,
    page_size: params?.page_size,
  });

  const data = await fetchJson<AdminHandOcrRecordsPageApiResponse>(
    `${HAND_OCR_ADMIN_ENDPOINTS.records}${queryString}`,
  );

  return normalizeAdminHandOcrRecordsPage(data);
}

export async function fetchAdminHandOcrHealth(): Promise<AdminHandOcrHealth> {
  const data = await fetchJson<AdminHandOcrHealthApiResponse>(
    HAND_OCR_ADMIN_ENDPOINTS.health,
  );
  return normalizeAdminHandOcrHealth(data);
}

export async function fetchAdminHandOcrImageUrl(
  key: string,
): Promise<string | null> {
  if (!key) return null;
  return `${HAND_OCR_ADMIN_ENDPOINTS.image}?key=${encodeURIComponent(key)}`;
}

export async function fetchAdminHandOcrBlocks(
  params?: AdminHandOcrBlockQuery,
): Promise<AdminHandOcrBlockItem[]> {
  const queryString = buildQueryString({
    keyword: params?.keyword,
    limit: params?.limit,
  });

  const data = await fetchJson<{ items?: AdminHandOcrBlockApiResponse[] }>(
    `${HAND_OCR_ADMIN_ENDPOINTS.blocks}${queryString}`,
  );

  return Array.isArray(data?.items)
    ? data.items.map(normalizeAdminHandOcrBlock)
    : [];
}

export async function releaseAdminHandOcrBlock(
  ip: string,
): Promise<AdminHandOcrActionResponse> {
  return fetchJson<AdminHandOcrActionResponse>(
    `${HAND_OCR_ADMIN_ENDPOINTS.blocks}/${encodeURIComponent(ip)}/release`,
    {
      method: 'POST',
    },
  );
}

export async function resetAdminHandOcrIpFailures(
  ip: string,
): Promise<AdminHandOcrActionResponse> {
  return fetchJson<AdminHandOcrActionResponse>(
    `/api/admin/handocr/ips/${encodeURIComponent(ip)}/reset-failures`,
    {
      method: 'POST',
    },
  );
}

export async function fetchAdminHandOcrSessions(
  params?: AdminHandOcrSessionQuery,
): Promise<AdminHandOcrSessionItem[]> {
  const queryString = buildQueryString({
    keyword: params?.keyword,
    limit: params?.limit,
  });

  const data = await fetchJson<{ items?: AdminHandOcrSessionApiResponse[] }>(
    `${HAND_OCR_ADMIN_ENDPOINTS.sessions}${queryString}`,
  );

  return Array.isArray(data?.items)
    ? data.items.map(normalizeAdminHandOcrSession)
    : [];
}

export async function expireAdminHandOcrSession(
  sessionId: string,
): Promise<AdminHandOcrActionResponse> {
  return fetchJson<AdminHandOcrActionResponse>(
    `${HAND_OCR_ADMIN_ENDPOINTS.sessions}/${encodeURIComponent(sessionId)}/expire`,
    {
      method: 'POST',
    },
  );
}
