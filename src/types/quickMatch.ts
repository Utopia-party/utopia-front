export interface QuickMatchRequest {
  service_id: string;
  preferred_conditions?: {
    estimated_price?: string;
    preferred_time?: string;
  };
}

export interface QuickMatchResultParty {
  id: string;
  title: string;
  service_name?: string | null;
  host_nickname?: string | null;
  member_count?: number;
  max_members?: number | null;
  monthly_price?: number | null;
}

export interface QuickMatchResponse {
  success: boolean;
  message?: string;
  matched_party?: QuickMatchResultParty | null;
  recommendations?: QuickMatchResultParty[];
}
