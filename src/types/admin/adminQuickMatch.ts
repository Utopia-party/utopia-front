export type QuickMatchStatus = 'requested' | 'matched' | 'failed' | 'expired';

export type CandidateStatus =
  | 'selected'
  | 'pending'
  | 'rejected'
  | 'failed'
  | 'skipped';

export type TrainingLabelStatus = 'pending' | 'success' | 'failed' | 'excluded';

export type MainTab = '요청 관리' | '학습 통계' | '학습 이벤트' | '품질 지표';

export type JsonRecord = Record<string, unknown>;

export type QuickMatchCandidateRow = {
  candidateId: string;
  requestId: string;
  partyId: string;
  partyName: string | null;
  rank: number | null;
  status: CandidateStatus;
  ruleScore: number;
  probabilityScore: number;
  finalScore: number;
  filterReasons: JsonRecord;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type QuickMatchRequestRow = {
  requestId: string;
  userId: string;
  userNickname: string;
  serviceId: string;
  serviceName: string;
  status: QuickMatchStatus;
  retryCount: number;
  preferredConditions: JsonRecord;
  matchedPartyId?: string | null;
  matchedPartyName?: string | null;
  failReason?: string | null;
  requestProfileSnapshot: JsonRecord;
  requestedAt?: string | null;
  matchedAt?: string | null;
  expiredAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isActive: boolean;
  totalMatchSeconds?: number | null;
  candidateCount: number;
  selectedCandidate?: QuickMatchCandidateRow | null;
  candidates: QuickMatchCandidateRow[];
};

export type AdminQuickMatchRequestResult = {
  resultId: string;
  selectedPartyId?: string | null;
  selectedCandidateId?: string | null;
  decisionReason?: string | null;
  requestSnapshot?: JsonRecord;
  candidateSnapshot?: JsonRecord;
  finalScores?: JsonRecord;
  createdAt?: string | null;
};

export type QuickMatchTrainingEvent = {
  eventId: string;
  requestId: string;
  candidateId?: string | null;
  userId: string;
  serviceId: string;
  partyId: string;
  isSelected: boolean;
  isJoined: boolean;
  matchSuccess?: boolean | null;
  labelStatus: TrainingLabelStatus;
  labelReason?: string | null;
  joinedAt?: string | null;
  leftAt?: string | null;
  labeledAt?: string | null;
  featuresSnapshot: JsonRecord;
  resultSnapshot: JsonRecord;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AdminQuickMatchDetailResponse = {
  request: QuickMatchRequestRow;
  result?: AdminQuickMatchRequestResult | null;
  trainingEvents: QuickMatchTrainingEvent[];
};

export type AdminQuickMatchSummary = {
  requests: {
    total: number;
    todayTotal: number;
    matched: number;
    failed: number;
    expired: number;
    requested: number;
    matchRate: number;
  };
  training: {
    labelCounts: Partial<Record<TrainingLabelStatus, number>>;
    successRate: number;
    sampleCount: number;
    lastGeneratedAt?: string | null;
  };
};

export type AdminQuickMatchListParams = {
  keyword?: string;
  status?: QuickMatchStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type AdminQuickMatchListResponse = {
  rows: QuickMatchRequestRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type TrainingEventListParams = {
  labelStatus?: TrainingLabelStatus | 'all';
  labelReason?: string;
  seedOnly?: boolean;
  page?: number;
  pageSize?: number;
};

export type TrainingEventListResponse = {
  rows: QuickMatchTrainingEvent[];
  total: number;
  page: number;
  pageSize: number;
};

export type TrainingStatRow = {
  statId: string;
  statType: string;
  statKey: string;
  successCount: number;
  failedCount: number;
  totalCount: number;
  successRate: number;
  generatedAt?: string | null;
  metadata: JsonRecord;
};

export type TrainingStatsResponse = {
  summary: {
    statCount: number;
    globalSuccessRate: number;
    globalSampleCount: number;
    lastGeneratedAt?: string | null;
  };
  rows: TrainingStatRow[];
};

export type QuickMatchQualityResponse = {
  summary: {
    success: number;
    failed: number;
    pending: number;
    excluded: number;
    trainableTotal: number;
    successRate: number;
  };
  reasonDistribution: Array<{
    labelStatus: TrainingLabelStatus;
    labelReason?: string | null;
    count: number;
  }>;
};

export type AdminQuickMatchActionResponse = {
  success: boolean;
  message?: string;
  requestId?: string;
  status?: string;
  result?: unknown;
  labelResult?: {
    success: number;
    failed: number;
    pending: number;
    excluded: number;
  };
  statsResult?: unknown;
};
