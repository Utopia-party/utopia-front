export type QuickMatchRequestStatus =
  | 'requested'
  | 'matched'
  | 'failed'
  | 'expired';

export interface QuickMatchCreateResponse {
  message: string;
  request_id: string;
  status: QuickMatchRequestStatus;
}

export type QuickMatchPreferredConditions = {
  duration_preference?: 'under_1_month' | '1_3_months' | 'over_3_months';
};

export interface QuickMatchCreatePayload {
  service_id: string;
  preferred_conditions?: QuickMatchPreferredConditions;
}

export interface QuickMatchCandidate {
  id: string;
  request_id: string;
  party_id: string;
  rule_score: number;
  probability_score: number;
  final_score: number;
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
    probability_score?: number;
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
  request_profile_snapshot?: Record<string, unknown> | null;
  requested_at: string;
  matched_at?: string | null;
  expired_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuickMatchDetailResponse {
  request: QuickMatchRequestResponse;
  candidates: QuickMatchCandidate[];
  result?: QuickMatchResultResponse | null;
}

// 성공모달 정산 금액 표시
export interface PaymentPreviewResponse {
  party_id: string;
  base_price: number;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  discount_reason?: string | null;
  pricing_type: 'normal' | 'quick_match';
  is_quick_match: boolean;
  quick_match_fee_rate: number;
}
