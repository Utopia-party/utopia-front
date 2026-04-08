export type PartyStatus = 'recruiting' | 'full' | 'completed' | 'canceled';

export interface Party {
  // ✅ Fix: 백엔드 응답 필드명에 맞게 수정 (party_id → id, host_id → leader_id 등)
  id: string;
  leader_id: string | null;
  service_id: string | null;
  title: string;
  status: PartyStatus | null;
  host_nickname: string | null;
  service_name: string | null; // platform_name → service_name
  category_name: string | null;
  max_members: number | null; // 신규 필드
  monthly_price: number | null; // 신규 필드
  logo_image_key: string | null; // 신규 필드
  logo_image_url: string | null;
  member_count: number;
}

export interface PartyListResponse {
  parties: Party[];
  total: number;
  page: number;
  size: number;
}

export interface Category {
  // ✅ Fix: category_id가 이제 카테고리 이름 문자열 (UUID 아님)
  // 백엔드: CategoryOut { category_id: str, category_name: str }
  category_id: string; // ex) "OTT", "생산성"
  category_name: string; // ex) "OTT", "생산성" (동일값)
}
