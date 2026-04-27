export type QuickMatchStatus =
  | 'REQUESTED'
  | 'MATCHED'
  | 'FAILED'
  | 'EXPIRED'
  | 'REMATCHING';

export type CandidateStatus = 'SELECTED' | 'PENDING' | 'REJECTED' | 'FAILED';

export type MainTab = '요청 관리' | '튜닝 설정';

export type HardFilterResult = {
  category_match?: boolean;
  platform_match?: boolean;
  duration_match?: boolean;
  trust_threshold_pass?: boolean;
  remaining_seat?: number;
  user_trust_score?: number;
  party_min_trust_score?: number;
};

export type RuleReason = {
  trust_fit_score?: number;
  capacity_score?: number;
  duration_score?: number;
};

export type FilterReasons = {
  score_basis?: string;
  match_mode?: string;
  vector_target?: boolean;
  vector_target_limit?: number;
  hard_filter?: HardFilterResult;
  rule_reason?: RuleReason;
  excluded_reason?: string;
  normal_match_unavailable_reason?: string;
  join_failure_reason?: string;
  lock_key?: string;
  retry_selected?: boolean;
};

export type StepTimings = {
  validationMs: number;
  profileEmbeddingMs: number;
  hardFilterMs: number;
  ruleScoringMs: number;
  vectorScoringMs: number;
  joinPartyMs: number;
};

export type QuickMatchCandidateRow = {
  candidateId: string;
  partyId: string;
  partyName: string;
  rank: number | null;
  status: CandidateStatus;
  ruleScore: number;
  vectorScore: number;
  finalScore: number;
  filterReasons: FilterReasons;
};

export type QuickMatchRequestRow = {
  requestId: string;
  requestedAt: string;
  userId: string;
  userNickname: string;
  serviceName: string;
  status: QuickMatchStatus;
  matchedPartyId?: string | null;
  matchedPartyName?: string | null;
  totalMatchSeconds?: number | null;
  retryCount: number;
  failReason?: string | null;
  stepTimings: StepTimings;
  aiProfileSnapshot: {
    trustScore: number;
    preferredConditions: {
      category?: string;
      platform?: string;
      durationPreference?: string;
    };
    activitySummary: {
      totalPartyJoinCount: number;
      servicePartyJoinCount: number;
      activePartyCount: number;
    };
    paymentSummary: {
      settlementSuccessCount: number;
    };
    riskSummary: {
      reportCount: number;
      leaveCount: number;
      isCurrentlyBanned: boolean;
    };
  };
  candidates: QuickMatchCandidateRow[];
};

export type TuningPolicy = {
  quickMatchEnabled: boolean;
  topN: number;
  maxCandidates: number;
  minMatchScore: number;
  vectorWeight: number;
  trustWeight: number;
  capacityWeight: number;
  durationWeight: number;
  joinPartyLockTtlSeconds: number;
  maxRetry: number;
};

export type AdminQuickMatchSummary = {
  total: number;
  todayTotal: number;
  matched: number;
  successRate: number;
  avgSeconds: number;
  stepAvg: StepTimings;
};

export type AdminQuickMatchListParams = {
  keyword?: string;
  status?: QuickMatchStatus | '전체';
  serviceName?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type AdminQuickMatchListResponse = {
  summary: AdminQuickMatchSummary;
  rows: QuickMatchRequestRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminQuickMatchPolicyResponse = {
  policy: TuningPolicy;
};

export type UpdateQuickMatchPolicyRequest = TuningPolicy;

export type AdminQuickMatchActionResponse = {
  success: boolean;
  message?: string;
};
