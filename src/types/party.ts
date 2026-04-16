export type PartyStatus = 'recruiting' | 'full' | 'completed' | 'canceled';

export type MyMemberStatus =
  | 'leader'
  | 'pending'
  | 'active'
  | 'kicked'
  | 'left'
  | 'rejected'
  | null;

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
  service_total_price: number | null;
  logo_image_key: string | null;
  logo_image_url: string | null;
  member_count: number;
  is_joined: boolean;
  my_member_status: MyMemberStatus;
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

// ---- v2: 내 파티 / 멤버 관리 ----

export interface MyParty extends Party {
  is_owner: boolean;
}

export interface MyPartyListResponse {
  parties: MyParty[];
}

export interface PartyMember {
  user_id: string;
  nickname: string | null;
  role: 'leader' | 'member' | string;
  is_current_user: boolean;
}

export interface PartyMembersResponse {
  members: PartyMember[];
}
