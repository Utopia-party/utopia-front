import { useMemo, useState, type ReactNode } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import Pagination from './components/Pagination';

// ─── 타입 ────────────────────────────────────────────────────────────────────

type QuickMatchStatus =
  | 'REQUESTED'
  | 'MATCHED'
  | 'FAILED'
  | 'EXPIRED'
  | 'REMATCHING';
type CandidateStatus = 'SELECTED' | 'PENDING' | 'REJECTED' | 'FAILED';
type MainTab = '요청 관리' | '튜닝 설정';

type HardFilterResult = {
  category_match?: boolean;
  platform_match?: boolean;
  duration_match?: boolean;
  trust_threshold_pass?: boolean;
  remaining_seat?: number;
  user_trust_score?: number;
  party_min_trust_score?: number;
};

type RuleReason = {
  trust_fit_score?: number;
  capacity_score?: number;
  duration_score?: number;
};

type FilterReasons = {
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

type StepTimings = {
  validationMs: number;
  profileEmbeddingMs: number;
  hardFilterMs: number;
  ruleScoringMs: number;
  vectorScoringMs: number;
  joinPartyMs: number;
};

type QuickMatchCandidateRow = {
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

type QuickMatchRequestRow = {
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

type TuningPolicy = {
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

// ─── Mock 데이터 ──────────────────────────────────────────────────────────────

const MOCK_POLICY: TuningPolicy = {
  quickMatchEnabled: true,
  topN: 5,
  maxCandidates: 30,
  minMatchScore: 0.7,
  vectorWeight: 0.5,
  trustWeight: 0.4,
  capacityWeight: 0.3,
  durationWeight: 0.3,
  joinPartyLockTtlSeconds: 30,
  maxRetry: 3,
};

const MOCK_ROWS: QuickMatchRequestRow[] = [
  {
    requestId: 'qm_req_20260423_001',
    requestedAt: '2026-04-23 13:42:11',
    userId: 'user_1024',
    userNickname: 'ott매니아',
    serviceName: 'Netflix',
    status: 'MATCHED',
    matchedPartyId: 'party_55',
    matchedPartyName: '넷플릭스 장기팟 A',
    totalMatchSeconds: 1.42,
    retryCount: 0,
    failReason: null,
    stepTimings: {
      validationMs: 80,
      profileEmbeddingMs: 310,
      hardFilterMs: 140,
      ruleScoringMs: 120,
      vectorScoringMs: 460,
      joinPartyMs: 310,
    },
    aiProfileSnapshot: {
      trustScore: 72.0,
      preferredConditions: {
        category: 'ott',
        platform: 'netflix',
        durationPreference: 'over_3_months',
      },
      activitySummary: {
        totalPartyJoinCount: 4,
        servicePartyJoinCount: 2,
        activePartyCount: 2,
      },
      paymentSummary: { settlementSuccessCount: 18 },
      riskSummary: { reportCount: 1, leaveCount: 2, isCurrentlyBanned: false },
    },
    candidates: [
      {
        candidateId: 'cand_1',
        partyId: 'party_55',
        partyName: '넷플릭스 장기팟 A',
        rank: 1,
        status: 'SELECTED',
        ruleScore: 0.91,
        vectorScore: 0.88,
        finalScore: 0.895,
        filterReasons: {
          score_basis: 'rule_vector_only',
          match_mode: 'normal',
          vector_target: true,
          vector_target_limit: 30,
          hard_filter: {
            category_match: true,
            platform_match: true,
            duration_match: true,
            trust_threshold_pass: true,
            remaining_seat: 2,
          },
          rule_reason: {
            trust_fit_score: 0.88,
            capacity_score: 0.5,
            duration_score: 1,
          },
        },
      },
      {
        candidateId: 'cand_2',
        partyId: 'party_89',
        partyName: '넷플릭스 단기팟 B',
        rank: 2,
        status: 'PENDING',
        ruleScore: 0.73,
        vectorScore: 0.7,
        finalScore: 0.715,
        filterReasons: {
          score_basis: 'rule_vector_only',
          match_mode: 'normal',
          vector_target: true,
          vector_target_limit: 30,
          hard_filter: {
            category_match: true,
            platform_match: true,
            duration_match: false,
            trust_threshold_pass: true,
            remaining_seat: 1,
          },
          rule_reason: {
            trust_fit_score: 0.8,
            capacity_score: 0.3,
            duration_score: 0.6,
          },
        },
      },
    ],
  },
  {
    requestId: 'qm_req_20260423_002',
    requestedAt: '2026-04-23 13:45:29',
    userId: 'user_2099',
    userNickname: '정산왕',
    serviceName: 'Wavve',
    status: 'FAILED',
    matchedPartyId: null,
    matchedPartyName: null,
    totalMatchSeconds: 0.94,
    retryCount: 1,
    failReason: 'NO_CANDIDATE',
    stepTimings: {
      validationMs: 60,
      profileEmbeddingMs: 240,
      hardFilterMs: 210,
      ruleScoringMs: 160,
      vectorScoringMs: 0,
      joinPartyMs: 0,
    },
    aiProfileSnapshot: {
      trustScore: 54.5,
      preferredConditions: {
        category: 'ott',
        platform: 'wavve',
        durationPreference: 'under_1_month',
      },
      activitySummary: {
        totalPartyJoinCount: 1,
        servicePartyJoinCount: 0,
        activePartyCount: 0,
      },
      paymentSummary: { settlementSuccessCount: 3 },
      riskSummary: { reportCount: 0, leaveCount: 0, isCurrentlyBanned: false },
    },
    candidates: [
      {
        candidateId: 'cand_3',
        partyId: 'party_77',
        partyName: '웨이브 프리미엄 4인팟',
        rank: null,
        status: 'REJECTED',
        ruleScore: 0,
        vectorScore: 0,
        finalScore: 0,
        filterReasons: {
          excluded_reason: 'trust_score_too_low',
          hard_filter: {
            user_trust_score: 54.5,
            party_min_trust_score: 60,
            trust_threshold_pass: false,
          },
        },
      },
      {
        candidateId: 'cand_4',
        partyId: 'party_78',
        partyName: '웨이브 1개월 팟',
        rank: null,
        status: 'REJECTED',
        ruleScore: 0,
        vectorScore: 0,
        finalScore: 0,
        filterReasons: {
          excluded_reason: 'party_embedding_not_found',
          normal_match_unavailable_reason: 'party_embedding_not_found',
        },
      },
    ],
  },
  {
    requestId: 'qm_req_20260423_003',
    requestedAt: '2026-04-23 14:01:03',
    userId: 'user_7751',
    userNickname: '장기유저',
    serviceName: 'YouTube Premium',
    status: 'REMATCHING',
    matchedPartyId: 'party_102',
    matchedPartyName: '유튜브 패밀리 B',
    totalMatchSeconds: 2.21,
    retryCount: 1,
    failReason: null,
    stepTimings: {
      validationMs: 90,
      profileEmbeddingMs: 350,
      hardFilterMs: 180,
      ruleScoringMs: 170,
      vectorScoringMs: 520,
      joinPartyMs: 900,
    },
    aiProfileSnapshot: {
      trustScore: 81.2,
      preferredConditions: {
        category: 'music',
        platform: 'youtube',
        durationPreference: 'flexible',
      },
      activitySummary: {
        totalPartyJoinCount: 7,
        servicePartyJoinCount: 3,
        activePartyCount: 1,
      },
      paymentSummary: { settlementSuccessCount: 25 },
      riskSummary: { reportCount: 0, leaveCount: 1, isCurrentlyBanned: false },
    },
    candidates: [
      {
        candidateId: 'cand_5',
        partyId: 'party_100',
        partyName: '유튜브 패밀리 A',
        rank: 1,
        status: 'FAILED',
        ruleScore: 0.84,
        vectorScore: 0.8,
        finalScore: 0.82,
        filterReasons: {
          score_basis: 'rule_vector_only',
          match_mode: 'normal',
          join_failure_reason: 'PARTY_FULL',
          lock_key: 'quick_match_lock:party_100',
          hard_filter: {
            category_match: true,
            platform_match: true,
            duration_match: true,
            trust_threshold_pass: true,
            remaining_seat: 0,
          },
          rule_reason: {
            trust_fit_score: 0.9,
            capacity_score: 0.1,
            duration_score: 1,
          },
        },
      },
      {
        candidateId: 'cand_6',
        partyId: 'party_102',
        partyName: '유튜브 패밀리 B',
        rank: 2,
        status: 'SELECTED',
        ruleScore: 0.8,
        vectorScore: 0.78,
        finalScore: 0.79,
        filterReasons: {
          score_basis: 'rule_vector_only',
          match_mode: 'normal',
          retry_selected: true,
          hard_filter: {
            category_match: true,
            platform_match: true,
            duration_match: true,
            trust_threshold_pass: true,
            remaining_seat: 2,
          },
          rule_reason: {
            trust_fit_score: 0.85,
            capacity_score: 0.5,
            duration_score: 1,
          },
        },
      },
    ],
  },
  {
    requestId: 'qm_req_20260423_004',
    requestedAt: '2026-04-23 14:22:55',
    userId: 'user_3301',
    userNickname: '스트리밍고수',
    serviceName: 'Netflix',
    status: 'REQUESTED',
    matchedPartyId: null,
    matchedPartyName: null,
    totalMatchSeconds: null,
    retryCount: 0,
    failReason: null,
    stepTimings: {
      validationMs: 40,
      profileEmbeddingMs: 0,
      hardFilterMs: 0,
      ruleScoringMs: 0,
      vectorScoringMs: 0,
      joinPartyMs: 0,
    },
    aiProfileSnapshot: {
      trustScore: 65.0,
      preferredConditions: {
        category: 'ott',
        platform: 'netflix',
        durationPreference: '1_3_months',
      },
      activitySummary: {
        totalPartyJoinCount: 2,
        servicePartyJoinCount: 1,
        activePartyCount: 0,
      },
      paymentSummary: { settlementSuccessCount: 7 },
      riskSummary: { reportCount: 0, leaveCount: 0, isCurrentlyBanned: false },
    },
    candidates: [],
  },
  {
    requestId: 'qm_req_20260423_005',
    requestedAt: '2026-04-23 14:55:10',
    userId: 'user_5512',
    userNickname: '음악러버',
    serviceName: 'Spotify',
    status: 'EXPIRED',
    matchedPartyId: null,
    matchedPartyName: null,
    totalMatchSeconds: null,
    retryCount: 3,
    failReason: 'NO_RECRUITING_PARTY',
    stepTimings: {
      validationMs: 70,
      profileEmbeddingMs: 290,
      hardFilterMs: 260,
      ruleScoringMs: 0,
      vectorScoringMs: 0,
      joinPartyMs: 0,
    },
    aiProfileSnapshot: {
      trustScore: 77.3,
      preferredConditions: {
        category: 'music',
        platform: 'spotify',
        durationPreference: 'over_3_months',
      },
      activitySummary: {
        totalPartyJoinCount: 5,
        servicePartyJoinCount: 2,
        activePartyCount: 1,
      },
      paymentSummary: { settlementSuccessCount: 14 },
      riskSummary: { reportCount: 0, leaveCount: 1, isCurrentlyBanned: false },
    },
    candidates: [],
  },
];

// ─── 상수 ────────────────────────────────────────────────────────────────────

const MAIN_TABS: MainTab[] = ['요청 관리', '튜닝 설정'];
const STATUS_FILTER_TABS = [
  '전체',
  'REQUESTED',
  'MATCHED',
  'FAILED',
  'EXPIRED',
  'REMATCHING',
];

const STATUS_STYLE: Record<QuickMatchStatus, string> = {
  REQUESTED: 'bg-blue-50 text-blue-600 border-blue-100',
  MATCHED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  FAILED: 'bg-rose-50 text-rose-600 border-rose-100',
  EXPIRED: 'bg-slate-100 text-slate-600 border-slate-200',
  REMATCHING: 'bg-amber-50 text-amber-600 border-amber-100',
};

const CANDIDATE_STATUS_STYLE: Record<CandidateStatus, string> = {
  SELECTED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  PENDING: 'bg-blue-50 text-blue-600 border-blue-100',
  REJECTED: 'bg-rose-50 text-rose-600 border-rose-100',
  FAILED: 'bg-amber-50 text-amber-600 border-amber-100',
};

const FAILURE_REASON_LABELS: Record<string, string> = {
  NO_CANDIDATE: '조건 통과 후보 없음',
  NO_RECRUITING_PARTY: '모집중 파티 없음',
  USER_EMBEDDING_NOT_FOUND: '사용자 임베딩 없음',
  party_embedding_not_found: '파티 임베딩 없음',
  trust_score_too_low: '신뢰도 부족',
  duration_mismatch: '기간 불일치',
  category_mismatch: '카테고리 불일치',
  platform_mismatch: '플랫폼 불일치',
  party_full: '정원 초과',
  PARTY_FULL: '가입 시점 정원 초과',
};

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function formatSeconds(value?: number | null) {
  if (value == null) return '-';
  return `${value.toFixed(2)}초`;
}

function formatMs(value?: number | null) {
  if (value == null) return '-';
  return `${value.toLocaleString()}ms`;
}

function labelFailureReason(value?: string | null) {
  if (!value) return '-';
  return FAILURE_REASON_LABELS[value] ?? value;
}

function formatOptional(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}

function getFailureReasonFromCandidate(candidate: QuickMatchCandidateRow) {
  return (
    candidate.filterReasons.excluded_reason ||
    candidate.filterReasons.normal_match_unavailable_reason ||
    candidate.filterReasons.join_failure_reason ||
    null
  );
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tone}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
        {title}
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div className="mt-2 text-sm opacity-80">{description}</div>
    </div>
  );
}

function PolicyField({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
      <div className="mt-3">{children}</div>
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
    />
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function AdminQuickMatch() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('요청 관리');

  // 운영 필터
  const [search, setSearch] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState('전체');
  const [serviceName, setServiceName] = useState('전체');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRequestId, setSelectedRequestId] = useState<string>(
    MOCK_ROWS[0]?.requestId ?? '',
  );

  // 튜닝 정책 상태
  const [policy, setPolicy] = useState<TuningPolicy>(MOCK_POLICY);
  const [policyDirty, setPolicyDirty] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);
  const [backfillRequested, setBackfillRequested] = useState(false);

  const services = useMemo(
    () => ['전체', ...Array.from(new Set(MOCK_ROWS.map((r) => r.serviceName)))],
    [],
  );

  const monitoringSummary = useMemo(() => {
    const total = MOCK_ROWS.length;
    const matched = MOCK_ROWS.filter(
      (row) => row.status === 'MATCHED' || row.status === 'REMATCHING',
    ).length;
    const failed = MOCK_ROWS.filter(
      (row) => row.status === 'FAILED' || row.status === 'EXPIRED',
    ).length;
    const completedWithTime = MOCK_ROWS.filter(
      (row) => row.totalMatchSeconds != null,
    );
    const avgSeconds = completedWithTime.length
      ? completedWithTime.reduce(
          (sum, row) => sum + (row.totalMatchSeconds ?? 0),
          0,
        ) / completedWithTime.length
      : 0;

    const reasonMap = new Map<string, number>();
    MOCK_ROWS.forEach((row) => {
      if (row.failReason)
        reasonMap.set(row.failReason, (reasonMap.get(row.failReason) ?? 0) + 1);
      row.candidates.forEach((candidate) => {
        const reason = getFailureReasonFromCandidate(candidate);
        if (reason) reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
      });
    });

    const stepAvg = {
      validationMs: Math.round(
        MOCK_ROWS.reduce((sum, row) => sum + row.stepTimings.validationMs, 0) /
          total,
      ),
      profileEmbeddingMs: Math.round(
        MOCK_ROWS.reduce(
          (sum, row) => sum + row.stepTimings.profileEmbeddingMs,
          0,
        ) / total,
      ),
      hardFilterMs: Math.round(
        MOCK_ROWS.reduce((sum, row) => sum + row.stepTimings.hardFilterMs, 0) /
          total,
      ),
      ruleScoringMs: Math.round(
        MOCK_ROWS.reduce((sum, row) => sum + row.stepTimings.ruleScoringMs, 0) /
          total,
      ),
      vectorScoringMs: Math.round(
        MOCK_ROWS.reduce(
          (sum, row) => sum + row.stepTimings.vectorScoringMs,
          0,
        ) / total,
      ),
      joinPartyMs: Math.round(
        MOCK_ROWS.reduce((sum, row) => sum + row.stepTimings.joinPartyMs, 0) /
          total,
      ),
    };

    return {
      total,
      matched,
      failed,
      successRate: total ? (matched / total) * 100 : 0,
      failRate: total ? (failed / total) * 100 : 0,
      avgSeconds,
      recentErrorCount: MOCK_ROWS.filter(
        (row) => row.status === 'FAILED' || row.status === 'EXPIRED',
      ).length,
      userEmbeddingMissingCount: 0,
      partyEmbeddingMissingCount:
        Array.from(reasonMap.entries()).find(
          ([key]) => key === 'party_embedding_not_found',
        )?.[1] ?? 0,
      failureReasons: Array.from(reasonMap.entries()).sort(
        (a, b) => b[1] - a[1],
      ),
      stepAvg,
    };
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return MOCK_ROWS.filter((row) => {
      const matchesKeyword =
        !keyword ||
        row.requestId.toLowerCase().includes(keyword) ||
        row.userId.toLowerCase().includes(keyword) ||
        row.userNickname.toLowerCase().includes(keyword) ||
        row.serviceName.toLowerCase().includes(keyword) ||
        (row.matchedPartyName ?? '').toLowerCase().includes(keyword);

      const matchesStatus =
        activeStatusTab === '전체' || row.status === activeStatusTab;
      const matchesService =
        serviceName === '전체' || row.serviceName === serviceName;
      const rowDate = row.requestedAt.slice(0, 10);
      const matchesFrom = !dateFrom || rowDate >= dateFrom;
      const matchesTo = !dateTo || rowDate <= dateTo;

      return (
        matchesKeyword &&
        matchesStatus &&
        matchesService &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [search, activeStatusTab, serviceName, dateFrom, dateTo]);

  const paginatedRows = filtered.slice((page - 1) * 20, page * 20);

  const selected = useMemo(
    () =>
      filtered.find((r) => r.requestId === selectedRequestId) ??
      filtered[0] ??
      null,
    [filtered, selectedRequestId],
  );

  const rejectedCount =
    selected?.candidates.filter((c) => c.status === 'REJECTED').length ?? 0;
  const failedCandidates =
    selected?.candidates.filter((c) => c.status === 'FAILED') ?? [];

  const handleReset = () => {
    setSearch('');
    setActiveStatusTab('전체');
    setServiceName('전체');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const updatePolicy = <K extends keyof TuningPolicy>(
    key: K,
    value: TuningPolicy[K],
  ) => {
    setPolicy((prev) => ({ ...prev, [key]: value }));
    setPolicyDirty(true);
    setPolicySaved(false);
  };

  const handleSavePolicy = () => {
    // TODO: PATCH /admin/quick-match/policy 연동
    setPolicyDirty(false);
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 2000);
  };

  const handleBackfill = () => {
    // TODO: POST /admin/quick-match/embedding-backfill 연동
    setBackfillRequested(true);
    setTimeout(() => setBackfillRequested(false), 2500);
  };

  return (
    <>
      <AdminHeader
        placeholder="요청 ID / 유저 / 서비스 / 파티 검색"
        onSearch={(value: string) => {
          setSearch(value);
          setActiveMainTab('요청 관리');
        }}
      />

      <div className="p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">빠른매칭 관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              상단에서는 빠른매칭 핵심 지표를 보고, 아래 탭에서 요청 관리와 튜닝
              설정을 처리합니다.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="오늘 요청 수"
            value={monitoringSummary.total.toLocaleString()}
            description="당일 생성된 빠른매칭 요청 수"
            tone="border-slate-200 bg-white text-slate-900"
          />
          <SummaryCard
            title="성공 / 실패율"
            value={`${monitoringSummary.successRate.toFixed(1)}% / ${monitoringSummary.failRate.toFixed(1)}%`}
            description={`${monitoringSummary.matched}건 성공 · ${monitoringSummary.failed}건 실패/만료`}
            tone="border-emerald-200 bg-emerald-50 text-emerald-700"
          />
          <SummaryCard
            title="평균 매칭 시간"
            value={formatSeconds(monitoringSummary.avgSeconds)}
            description="요청 생성부터 매칭 완료까지 평균"
            tone="border-blue-200 bg-blue-50 text-blue-700"
          />
          <SummaryCard
            title="최근 에러 / 임베딩"
            value={`${monitoringSummary.recentErrorCount}건`}
            description={`사용자 임베딩 누락 ${monitoringSummary.userEmbeddingMissingCount}건 · 파티 임베딩 누락 ${monitoringSummary.partyEmbeddingMissingCount}건`}
            tone="border-amber-200 bg-amber-50 text-amber-700"
          />
        </div>

        <div className="mb-6 flex gap-1 border-b border-gray-200">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab)}
              className={`border-b-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                activeMainTab === tab
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {activeMainTab === '요청 관리' && (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 pt-4">
                <FilterTabs
                  tabs={STATUS_FILTER_TABS}
                  activeTab={activeStatusTab}
                  onTabChange={(tab: string) => {
                    setActiveStatusTab(tab);
                    setPage(1);
                  }}
                />

                <div className="mb-4 mt-4 flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500">
                      키워드
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="요청ID / 유저 / 서비스"
                      className="w-44 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500">
                      서비스
                    </span>
                    <select
                      value={serviceName}
                      onChange={(e) => {
                        setServiceName(e.target.value);
                        setPage(1);
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
                    >
                      {services.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500">
                      시작일
                    </span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setPage(1);
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500">
                      종료일
                    </span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setPage(1);
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </label>

                  <button
                    onClick={handleReset}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    초기화
                  </button>

                  <div className="ml-auto self-end pb-2 text-xs text-slate-400">
                    총 {filtered.length}건
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {[
                        '요청 시각',
                        '요청 ID',
                        '사용자',
                        '서비스',
                        '상태',
                        '선택 파티',
                        '소요 시간',
                        '재시도',
                      ].map((head) => (
                        <th
                          key={head}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-500"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr
                        key={row.requestId}
                        onClick={() => setSelectedRequestId(row.requestId)}
                        className={`cursor-pointer border-b border-slate-100 transition hover:bg-indigo-50/40 ${
                          selected?.requestId === row.requestId
                            ? 'bg-indigo-50/60'
                            : 'bg-white'
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                          {row.requestedAt}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          {row.requestId}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-semibold text-slate-800">
                            {row.userNickname}
                          </div>
                          <div className="text-xs text-slate-400">
                            {row.userId}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {row.serviceName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[row.status]}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatOptional(row.matchedPartyName)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatSeconds(row.totalMatchSeconds)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {row.retryCount}회
                        </td>
                      </tr>
                    ))}
                    {paginatedRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-sm text-slate-400"
                        >
                          조건에 맞는 빠른매칭 요청이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 px-5 py-4">
                <Pagination
                  total={filtered.length}
                  page={page}
                  pageSize={20}
                  onChange={setPage}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {!selected ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  선택된 요청이 없습니다.
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        요청 상세
                      </div>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">
                        {selected.requestId}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {selected.userNickname} · {selected.serviceName} ·{' '}
                        {selected.requestedAt}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[selected.status]}`}
                    >
                      {selected.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      ['최종 결과', formatOptional(selected.matchedPartyName)],
                      ['실패 사유', labelFailureReason(selected.failReason)],
                      ['후보 수', `${selected.candidates.length}개`],
                      ['제외 후보 수', `${rejectedCount}개`],
                      ['가입 실패 후보', `${failedCandidates.length}개`],
                      [
                        '총 소요 시간',
                        formatSeconds(selected.totalMatchSeconds),
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="text-xs font-medium text-slate-400">
                          {label}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-900">
                      단계별 소요 시간
                    </h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {[
                        ['요청 검증', selected.stepTimings.validationMs],
                        [
                          '프로필/임베딩',
                          selected.stepTimings.profileEmbeddingMs,
                        ],
                        ['하드 필터링', selected.stepTimings.hardFilterMs],
                        ['Rule 점수', selected.stepTimings.ruleScoringMs],
                        ['Vector 점수', selected.stepTimings.vectorScoringMs],
                        ['join_party()', selected.stepTimings.joinPartyMs],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                        >
                          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            {label}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-800">
                            {formatMs(Number(value))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-900">
                      사용자 프로필 스냅샷
                    </h3>
                    <div className="mt-3 grid gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-xs font-medium text-slate-400">
                          요청 조건
                        </div>
                        <div className="mt-1 text-sm text-slate-700">
                          카테고리{' '}
                          {formatOptional(
                            selected.aiProfileSnapshot.preferredConditions
                              .category,
                          )}{' '}
                          · 플랫폼{' '}
                          {formatOptional(
                            selected.aiProfileSnapshot.preferredConditions
                              .platform,
                          )}{' '}
                          · 선호기간{' '}
                          {formatOptional(
                            selected.aiProfileSnapshot.preferredConditions
                              .durationPreference,
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="text-xs font-medium text-slate-400">
                            활동 요약
                          </div>
                          <div className="mt-1 text-sm text-slate-700">
                            총{' '}
                            {
                              selected.aiProfileSnapshot.activitySummary
                                .totalPartyJoinCount
                            }
                            회 · 서비스{' '}
                            {
                              selected.aiProfileSnapshot.activitySummary
                                .servicePartyJoinCount
                            }
                            회 · 활성{' '}
                            {
                              selected.aiProfileSnapshot.activitySummary
                                .activePartyCount
                            }
                            개
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="text-xs font-medium text-slate-400">
                            리스크 / 신뢰도
                          </div>
                          <div className="mt-1 text-sm text-slate-700">
                            신뢰도{' '}
                            {selected.aiProfileSnapshot.trustScore.toFixed(1)} ·
                            신고{' '}
                            {selected.aiProfileSnapshot.riskSummary.reportCount}
                            회 · 이탈{' '}
                            {selected.aiProfileSnapshot.riskSummary.leaveCount}
                            회 · 정산 성공{' '}
                            {
                              selected.aiProfileSnapshot.paymentSummary
                                .settlementSuccessCount
                            }
                            회
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        후보 / 결과 상세
                      </h3>
                      <div className="text-xs text-slate-400">
                        rule / vector / final
                      </div>
                    </div>

                    <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
                      {selected.candidates.map((candidate) => (
                        <div
                          key={candidate.candidateId}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                #{candidate.rank ?? '-'} {candidate.partyName}
                              </div>
                              <div className="mt-1 text-xs text-slate-400">
                                {candidate.partyId}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${CANDIDATE_STATUS_STYLE[candidate.status]}`}
                              >
                                {candidate.status}
                              </span>
                              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                                Final {candidate.finalScore.toFixed(3)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            {[
                              ['Rule', candidate.ruleScore.toFixed(3)],
                              ['Vector', candidate.vectorScore.toFixed(3)],
                              ['Final', candidate.finalScore.toFixed(3)],
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                              >
                                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                  {label}
                                </div>
                                <div className="mt-1 text-sm font-semibold text-slate-800">
                                  {value}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                            <div className="text-xs font-medium text-slate-400">
                              필터 / 점수 근거
                            </div>
                            <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
                              {JSON.stringify(candidate.filterReasons, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                      {selected.candidates.length === 0 && (
                        <div className="py-4 text-center text-sm text-slate-400">
                          후보 데이터가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      운영 액션
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100">
                        실패 요청 재시도
                      </button>
                      <button className="rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                        사용자 임베딩 재생성
                      </button>
                      <button className="rounded-md border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">
                        파티 임베딩 재생성
                      </button>
                      <button className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                        요청 강제 실패
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeMainTab === '튜닝 설정' && (
          <div className="space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    튜닝 설정
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Rule 종류 추가는 코드 수정 영역이고, 관리자 페이지에서는
                    기준값/가중치/락 TTL만 조정합니다.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBackfill}
                    className="rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    {backfillRequested ? '백필 요청됨 ✓' : '임베딩 백필 실행'}
                  </button>
                  <button
                    onClick={handleSavePolicy}
                    disabled={!policyDirty}
                    className="rounded-md border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {policySaved ? '저장됨 ✓' : '튜닝값 저장'}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        빠른매칭 전체 사용
                      </div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">
                        장애 시 전체 요청을 막는 kill switch입니다.
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        updatePolicy(
                          'quickMatchEnabled',
                          !policy.quickMatchEnabled,
                        )
                      }
                      className={`min-w-[72px] rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        policy.quickMatchEnabled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {policy.quickMatchEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <PolicyField
                  label="최종 추천 개수 N"
                  description="Rule + Vector 정렬 후 사용자에게 적용할 최종 상위 N개입니다."
                >
                  <NumberInput
                    value={policy.topN}
                    min={1}
                    max={20}
                    onChange={(value) => updatePolicy('topN', value)}
                  />
                </PolicyField>

                <PolicyField
                  label="후보 탐색 개수"
                  description="하드필터 통과 후 vector score를 계산할 최대 후보 수입니다."
                >
                  <NumberInput
                    value={policy.maxCandidates}
                    min={5}
                    max={200}
                    onChange={(value) => updatePolicy('maxCandidates', value)}
                  />
                </PolicyField>

                <PolicyField
                  label="최소 매칭 점수"
                  description="final_score가 이 값보다 낮으면 매칭 실패로 처리합니다."
                >
                  <NumberInput
                    value={policy.minMatchScore}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => updatePolicy('minMatchScore', value)}
                  />
                </PolicyField>

                <PolicyField
                  label="Vector 가중치"
                  description="임베딩 유사도 점수가 최종 점수에 반영되는 비율입니다."
                >
                  <NumberInput
                    value={policy.vectorWeight}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(value) => updatePolicy('vectorWeight', value)}
                  />
                </PolicyField>

                <PolicyField
                  label="최대 재시도 횟수"
                  description="join_party 실패, 정원 초과, 상태 변경 시 다음 후보를 시도하는 횟수입니다."
                >
                  <NumberInput
                    value={policy.maxRetry}
                    min={0}
                    max={10}
                    onChange={(value) => updatePolicy('maxRetry', value)}
                  />
                </PolicyField>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">
                  Rule 점수 가중치
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  현재 Rule은 신뢰도/좌석/기간 적합도 기준값만 관리자에서
                  조정합니다.
                </p>

                <div className="mt-5 grid gap-4">
                  <PolicyField
                    label="신뢰도 적합도 가중치"
                    description="사용자 신뢰도와 파티 최소 신뢰도 차이를 점수화합니다."
                  >
                    <NumberInput
                      value={policy.trustWeight}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(value) => updatePolicy('trustWeight', value)}
                    />
                  </PolicyField>
                  <PolicyField
                    label="좌석 여유도 가중치"
                    description="remaining_seat가 많은 파티를 더 안정적으로 추천합니다."
                  >
                    <NumberInput
                      value={policy.capacityWeight}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(value) =>
                        updatePolicy('capacityWeight', value)
                      }
                    />
                  </PolicyField>
                  <PolicyField
                    label="기간 적합도 가중치"
                    description="사용자 선호기간과 파티 기간 조건의 적합도를 반영합니다."
                  >
                    <NumberInput
                      value={policy.durationWeight}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(value) =>
                        updatePolicy('durationWeight', value)
                      }
                    />
                  </PolicyField>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">
                  join_party() / Redis Lock
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  락 TTL 설정값은 튜닝하고, 실제 소요 시간은 모니터링/운영에서
                  확인합니다.
                </p>

                <div className="mt-5 grid gap-4">
                  <PolicyField
                    label="Redis Lock TTL"
                    description="join_party()에서 current_members 증가를 보호하는 분산락 TTL입니다."
                  >
                    <NumberInput
                      value={policy.joinPartyLockTtlSeconds}
                      min={5}
                      max={120}
                      onChange={(value) =>
                        updatePolicy('joinPartyLockTtlSeconds', value)
                      }
                    />
                  </PolicyField>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      현재 관측값
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <div className="text-xs font-medium text-slate-400">
                          평균 join_party()
                        </div>
                        <div className="mt-1 text-lg font-bold text-slate-900">
                          {formatMs(monitoringSummary.stepAvg.joinPartyMs)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <div className="text-xs font-medium text-slate-400">
                          현재 TTL
                        </div>
                        <div className="mt-1 text-lg font-bold text-slate-900">
                          {policy.joinPartyLockTtlSeconds}초
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    Rule 종류 추가, 하드필터 조건 추가, 점수 산식 자체 변경은
                    관리자 페이지에서 바로 열지 말고 코드 배포로 관리하는 것을
                    권장합니다.
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
