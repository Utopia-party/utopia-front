import { api } from '../apis/api';
import type { PartyListResponse, Party, Category } from '../types/party';

export const partyKeys = {
  all: ['parties'] as const,
  list: (category: string | null, search: string, refreshKey?: number) =>
    ['parties', 'list', category, search, refreshKey ?? 0] as const,
  detail: (id: string) => ['parties', id] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
};

export const searchKeys = {
  trending: ['trendingKeywords'] as const,
};

// ── sessionStorage 캐시 (random 파티 목록 전용) ──────────────────
const SESSION_CACHE_PREFIX = 'partylist:';

function getSessionCache(key: string): PartyListResponse | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as PartyListResponse) : null;
  } catch {
    return null;
  }
}

function setSessionCache(key: string, data: PartyListResponse) {
  try {
    sessionStorage.setItem(SESSION_CACHE_PREFIX + key, JSON.stringify(data));
  } catch {
    // sessionStorage 용량 초과 등 무시
  }
}

// ── API 함수 ─────────────────────────────────────────────────────

export const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get('/api/parties/categories');
  return data;
};

export const fetchParties = async (params: {
  category_name?: string;
  service_id?: string;
  search?: string;
  page?: number;
  size?: number;
  random?: boolean;
  refreshKey?: number; // 캐시 키 구분용 (API에는 안 보냄)
}): Promise<PartyListResponse> => {
  const { refreshKey, ...apiParams } = params;

  // random 요청이고 검색어 없을 때만 sessionStorage 캐시 적용
  if (apiParams.random && !apiParams.search) {
    const cacheKey = `${apiParams.category_name ?? '__all__'}:${refreshKey ?? 0}`;
    const cached = getSessionCache(cacheKey);
    if (cached) return cached;

    const { data } = await api.get('/api/parties', { params: apiParams });
    setSessionCache(cacheKey, data);
    return data;
  }

  // 검색어 있거나 random 아닌 경우 캐시 없이 바로 호출
  const { data } = await api.get('/api/parties', { params: apiParams });
  return data;
};

export const fetchParty = async (id: string): Promise<Party> => {
  const { data } = await api.get(`/api/parties/${id}`);
  return data;
};

export const applyParty = async (
  partyId: string,
): Promise<{ message: string }> => {
  const { data } = await api.post(`/api/parties/${partyId}/join`);
  return data;
};

export const fetchTrendingKeywords = async (): Promise<string[]> => {
  const { data } = await api.get('/api/search/trending');
  return data.keywords || data;
};

export const recordSearchKeyword = async (keyword: string): Promise<void> => {
  if (!keyword) return;
  await api.post('/api/search/record', { keyword });
};
