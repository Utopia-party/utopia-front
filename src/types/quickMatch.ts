export type QuickMatchPreferredConditions = {
  price_range?: string;
  duration_preference?: 'short_term' | 'long_term' | 'flexible' | '';
};

export interface QuickMatchCreatePayload {
  service_id: string;
  preferred_conditions?: QuickMatchPreferredConditions;
}

export interface QuickMatchCreateResponse {
  message: string;
  request_id: string;
  status: string;
}

export interface QuickMatchCandidate {
  id: string;
  request_id: string;
  party_id: string;
  rule_score: number;
  vector_score: number;
  llm_score: number;
  ai_score: number;
  rank?: number | null;
  filter_reasons?: Record<string, unknown> | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface QuickMatchResultResponse {
  id: string;
  request_id: string;
  selected_party_id?: string | null;
  selected_candidate_id?: string | null;
  request_snapshot?: Record<string, unknown> | null;
  candidate_snapshot?: Record<string, unknown> | null;
  final_scores?: {
    rule_score?: number;
    vector_score?: number;
    llm_score?: number;
    final_score?: number;
  } | null;
  decision_reason?: string | null;
  created_at: string;
}

export interface QuickMatchRequestResponse {
  id: string;
  user_id: string;
  service_id: string;
  status: string;
  retry_count: number;
  preferred_conditions?: QuickMatchPreferredConditions | null;
  matched_party_id?: string | null;
  fail_reason?: string | null;
  ai_profile_snapshot?: Record<string, unknown> | null;
  requested_at: string;
  matched_at?: string | null;
  expired_at?: string | null;
  cancelled_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuickMatchDetailResponse {
  request: QuickMatchRequestResponse;
  candidates: QuickMatchCandidate[];
  result?: QuickMatchResultResponse | null;
}
