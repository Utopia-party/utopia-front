import { api } from '../api';

export type ShadowModeResponse = {
  shadow_mode: boolean;
  lstm_weight?: number;
  score_formula?: string;
  message?: string;
};

export type BlockedIpEntry = {
  ip: string;
  lock: boolean;
  ban: boolean;
  wait: boolean;
  lock_count: number;
  ttl: Record<string, number>;
};

export type BlockedIpsResponse = {
  blocked_ips: BlockedIpEntry[];
  total: number;
};

export type CaptchaConfigResponse = {
  lstm_weight: number;
  knn_weight: number;
  rule_weight: number;
  pass_threshold: number;
  challenge_threshold: number;
  message?: string;
};

export type CaptchaPeriod = 'daily' | 'weekly' | 'monthly';

export type CaptchaSummaryStats = {
  total: number;
  pass_count: number;
  challenge_count: number;
  block_count: number;
  pass_rate: number;
  challenge_rate: number;
  block_rate: number;
};

export type ScoreDistributionBucket = {
  range: string;
  count: number;
};

export type TrendPoint = {
  date: string;
  display: string;
  pass: number;
  challenge: number;
  block: number;
};

export type ChallengeDetail = {
  total: number;
  pass_count: number;
  pending_count: number;
  pass_rate: number;
  avg_solve_time_ms: number;
};

export type CaptchaStatsResponse = {
  period: CaptchaPeriod;
  start_date: string;
  end_date: string;
  summary: CaptchaSummaryStats;
  challenge_detail: ChallengeDetail;
  score_distribution: ScoreDistributionBucket[];
  trend: TrendPoint[];
};

export type CaptchaSessionEntry = {
  id: string;
  trigger_type: string;
  client_ip: string;
  behavior_score: number | null;
  vector_score: number | null;
  lstm_score: number | null;
  final_score: number | null;
  status: string;
  attempt_count: number;
  solve_time_ms: number | null;
  is_correct: boolean | null;
  created_at: string;
};

export type CaptchaSessionsResponse = {
  sessions: CaptchaSessionEntry[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
};

export type CaptchaImageItem = {
  id: string;
  category: string;
  url: string;
};

export type SessionImagesResponse = {
  session_id: string;
  captcha_set_id?: string;
  emojis: CaptchaImageItem[];
  photos: CaptchaImageItem[];
  answer_indices: number[];
  message?: string;
};

export type CaptchaImageDetail = {
  id: string;
  category: string;
  image_key: string;
  url: string;
  created_at: string | null;
};

export type CategoryCount = {
  category: string;
  count: number;
};

export type CaptchaImagesResponse = {
  image_type: string;
  categories: CategoryCount[];
  images: CaptchaImageDetail[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
};

export type CaptchaSetInfo = {
  id: string;
  emoji_count: number;
  photo_count: number;
  answer_indices: number[];
  use_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string | null;
};

export type ImageSetsResponse = {
  image_id: string;
  image_type: string;
  sets: CaptchaSetInfo[];
  total: number;
};

export async function fetchShadowMode(): Promise<ShadowModeResponse> {
  const { data } = await api.get('/api/admin/captcha/shadow');
  return data;
}

export async function toggleShadowMode(): Promise<ShadowModeResponse> {
  const { data } = await api.put('/api/admin/captcha/shadow');
  return data;
}

export async function fetchBlockedIps(): Promise<BlockedIpsResponse> {
  const { data } = await api.get('/api/admin/captcha/blocked-ips');
  return data;
}

export async function unblockIp(
  ip: string,
): Promise<{ ip: string; unblocked: boolean; message: string }> {
  const { data } = await api.delete(
    `/api/admin/captcha/blocked-ips/${encodeURIComponent(ip)}`,
  );
  return data;
}

export async function unblockAllIps(): Promise<{
  total_deleted: number;
  message: string;
}> {
  const { data } = await api.delete('/api/admin/captcha/blocked-ips');
  return data;
}

export async function fetchCaptchaConfig(): Promise<CaptchaConfigResponse> {
  const { data } = await api.get('/api/admin/captcha/config');
  return data;
}

export async function updateCaptchaConfig(
  config: Partial<Omit<CaptchaConfigResponse, 'rule_weight' | 'message'>>,
): Promise<CaptchaConfigResponse> {
  const { data } = await api.put('/api/admin/captcha/config', config);
  return data;
}

export async function forceChallenge(
  ip?: string,
): Promise<{ message: string }> {
  const { data } = await api.post(
    '/api/admin/captcha/force-challenge',
    ip ? { ip } : {},
  );
  return data;
}

export async function fetchCaptchaStats(
  period: CaptchaPeriod = 'daily',
  startDate?: string,
  endDate?: string,
): Promise<CaptchaStatsResponse> {
  const { data } = await api.get('/api/admin/captcha/stats', {
    params: {
      period,
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    },
  });
  return data;
}

export async function fetchCaptchaSessions(
  page: number = 1,
  size: number = 20,
  status?: string,
): Promise<CaptchaSessionsResponse> {
  const { data } = await api.get('/api/admin/captcha/sessions', {
    params: { page, size, ...(status ? { status } : {}) },
  });
  return data;
}

export async function fetchSessionImages(
  sessionId: string,
): Promise<SessionImagesResponse> {
  const { data } = await api.get(
    `/api/admin/captcha/sessions/${sessionId}/images`,
  );
  return data;
}

export async function fetchCaptchaImages(
  imageType: 'emoji' | 'photo',
  category?: string,
  page: number = 1,
  size: number = 50,
): Promise<CaptchaImagesResponse> {
  const { data } = await api.get('/api/admin/captcha/images', {
    params: {
      image_type: imageType,
      ...(category ? { category } : {}),
      page,
      size,
    },
  });
  return data;
}

export async function fetchImageSets(
  imageId: string,
  imageType: 'emoji' | 'photo',
): Promise<ImageSetsResponse> {
  const { data } = await api.get(`/api/admin/captcha/images/${imageId}/sets`, {
    params: { image_type: imageType },
  });
  return data;
}

export async function deactivateCaptchaSet(
  setId: string,
): Promise<{ set_id: string; is_active: boolean; message: string }> {
  const { data } = await api.put(`/api/admin/captcha/sets/${setId}/deactivate`);
  return data;
}

export async function deactivateImage(
  imageId: string,
  imageType: 'emoji' | 'photo',
): Promise<{
  image_id: string;
  image_type: string;
  category: string;
  deactivated_sets_count: number;
  message: string;
}> {
  const { data } = await api.put(
    `/api/admin/captcha/images/${imageId}/deactivate`,
    null,
    { params: { image_type: imageType } },
  );
  return data;
}

export async function batchDeactivateImages(
  imageIds: string[],
  imageType: 'emoji' | 'photo',
): Promise<{
  deactivated_images: number;
  deactivated_sets: number;
  message: string;
}> {
  const { data } = await api.put('/api/admin/captcha/images/batch-deactivate', {
    image_ids: imageIds,
    image_type: imageType,
  });
  return data;
}

export async function generateCaptchaImages(params: {
  num_per_category: number;
  num_sets: number;
  categories?: string;
}): Promise<{
  status: string;
  message: string;
  num_per_category?: number;
  num_sets?: number;
  categories?: string;
}> {
  const { data } = await api.post('/api/admin/captcha/generate', params);
  return data;
}

export async function getGenerateStatus(): Promise<{
  progress: string;
  last_result: string | null;
}> {
  const { data } = await api.get('/api/admin/captcha/generate/status');
  return data;
}
