export type PartyStatus = 'recruiting' | 'full' | 'completed' | 'canceled';

export interface Party {
  id: string;
  leader_id: string | null;
  service_id: string | null;
  title: string;
  status: PartyStatus | null;
  host_nickname: string | null;
  host_trust_score: number | null;  
  service_name: string | null;
  category_name: string | null;
  max_members: number | null;
  monthly_price: number | null;
  original_price: number | null;
  logo_image_key: string | null;
  logo_image_url: string | null;
  member_count: number;
  is_joined: boolean;
}

export interface PartyListResponse {
  parties: Party[];
  total: number;
  page: number;
  size: number;
}

export interface Category {
  name: string;  
}
