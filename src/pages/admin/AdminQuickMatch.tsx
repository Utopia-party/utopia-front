import { useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';

type QuickMatchStatus =
  | 'REQUESTED'
  | 'MATCHED'
  | 'FAILED'
  | 'EXPIRED'
  | 'REMATCHING';

type CandidateStatus = 'SELECTED' | 'PENDING' | 'REJECTED' | 'FAILED';

type FilterReasonMap = Record<string, unknown>;

type QuickMatchCandidateRow = {
  candidateId: string;
  partyId: string;
  partyName: string;
  rank: number;
  status: CandidateStatus;
  ruleScore: number;
  vectorScore: number;
  llmScore: number;
  aiScore: number;
  llmApplied: boolean;
  filterReasons: FilterReasonMap;
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
  aiProfileSnapshot: {
    trustScore: number;
    preferredConditions: {
      category?: string;
      platform?: string;
      priceRange?: string;
      durationPreference?: string;
    };
    activitySummary: {
      totalPartyJoinCount: number;
      servicePartyJoinCount: number;
      activePartyCount: number;
    };
    paymentSummary: {
      averagePaymentAmount: number;
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

const SUMMARY = {
  totalRequestsToday: 128,
  successCount: 94,
  failCount: 21,
  successRate: 73.4,
  avgMatchSeconds: 1.8,
  rematchCount: 14,
  missingPartyEmbeddingCount: 3,
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
    aiProfileSnapshot: {
      trustScore: 72.0,
      preferredConditions: {
        category: 'ott',
        platform: 'netflix',
        priceRange: '10000-17000',
        durationPreference: 'long_term',
      },
      activitySummary: {
        totalPartyJoinCount: 4,
        servicePartyJoinCount: 2,
        activePartyCount: 2,
      },
      paymentSummary: {
        averagePaymentAmount: 14500,
        settlementSuccessCount: 18,
      },
      riskSummary: {
        reportCount: 1,
        leaveCount: 2,
        isCurrentlyBanned: false,
      },
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
        llmScore: 0.93,
        aiScore: 0.908,
        llmApplied: true,
        filterReasons: {
          llm_reason: '장기 이용 성향과 가격대가 잘 맞고 신뢰도 여유도 충분함',
          llm_applied: true,
          match_mode: 'normal',
          hard_filter: {
            category_match: true,
            platform_match: true,
            price_match: true,
            duration_match: true,
            trust_threshold_pass: true,
            remaining_seat: 2,
          },
          rule_reason: {
            trust_fit_score: 0.88,
            capacity_score: 0.5,
            price_score: 1,
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
        llmScore: 0.76,
        aiScore: 0.729,
        llmApplied: true,
        filterReasons: {
          llm_reason: '조건은 맞지만 장기 유지 가능성은 상대적으로 낮음',
          llm_applied: true,
          match_mode: 'normal',
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
    aiProfileSnapshot: {
      trustScore: 54.5,
      preferredConditions: {
        category: 'ott',
        platform: 'wavve',
        priceRange: '7000-10000',
        durationPreference: 'short_term',
      },
      activitySummary: {
        totalPartyJoinCount: 1,
        servicePartyJoinCount: 0,
        activePartyCount: 0,
      },
      paymentSummary: {
        averagePaymentAmount: 8900,
        settlementSuccessCount: 3,
      },
      riskSummary: {
        reportCount: 0,
        leaveCount: 0,
        isCurrentlyBanned: false,
      },
    },
    candidates: [
      {
        candidateId: 'cand_3',
        partyId: 'party_77',
        partyName: '웨이브 프리미엄 4인팟',
        rank: 1,
        status: 'REJECTED',
        ruleScore: 0,
        vectorScore: 0,
        llmScore: 0,
        aiScore: 0,
        llmApplied: false,
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
        rank: 2,
        status: 'REJECTED',
        ruleScore: 0,
        vectorScore: 0,
        llmScore: 0,
        aiScore: 0,
        llmApplied: false,
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
    aiProfileSnapshot: {
      trustScore: 81.2,
      preferredConditions: {
        category: 'music',
        platform: 'youtube',
        priceRange: '5000-9000',
        durationPreference: 'flexible',
      },
      activitySummary: {
        totalPartyJoinCount: 7,
        servicePartyJoinCount: 3,
        activePartyCount: 1,
      },
      paymentSummary: {
        averagePaymentAmount: 7900,
        settlementSuccessCount: 25,
      },
      riskSummary: {
        reportCount: 0,
        leaveCount: 1,
        isCurrentlyBanned: false,
      },
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
        llmScore: 0.85,
        aiScore: 0.832,
        llmApplied: true,
        filterReasons: {
          llm_reason: '최초 선택 후보였으나 join 시점에 파티가 가득 참',
          llm_applied: true,
          match_mode: 'normal',
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
        llmScore: 0.81,
        aiScore: 0.797,
        llmApplied: true,
        filterReasons: {
          llm_reason: '재매칭 대상 중 가장 안정적인 대안',
          llm_applied: true,
          match_mode: 'normal',
        },
      },
    ],
  },
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

function formatSeconds(value?: number | null) {
  if (value == null) return '-';
  return `${value.toFixed(2)}초`;
}

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

function ToggleCard({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`min-w-[72px] rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            enabled
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}

export default function AdminQuickMatch() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'전체' | QuickMatchStatus>('전체');
  const [serviceName, setServiceName] = useState('전체');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    MOCK_ROWS[0]?.requestId ?? null,
  );

  const [quickMatchEnabled, setQuickMatchEnabled] = useState(true);
  const [llmEnabled, setLlmEnabled] = useState(true);
  const [fallbackOnlyEnabled, setFallbackOnlyEnabled] = useState(false);
  const [maxRetry, setMaxRetry] = useState(3);
  const [llmTopN, setLlmTopN] = useState(5);
  const [ruleWeight, setRuleWeight] = useState(0.4);
  const [vectorWeight, setVectorWeight] = useState(0.3);
  const [llmWeight, setLlmWeight] = useState(0.3);

  const weightSum = Number((ruleWeight + vectorWeight + llmWeight).toFixed(2));
  const isWeightValid = weightSum === 1;

  const services = useMemo(
    () => [
      '전체',
      ...Array.from(new Set(MOCK_ROWS.map((row) => row.serviceName))),
    ],
    [],
  );

  const filtered = useMemo(() => {
    return MOCK_ROWS.filter((row) => {
      const keyword = search.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        row.requestId.toLowerCase().includes(keyword) ||
        row.userId.toLowerCase().includes(keyword) ||
        row.userNickname.toLowerCase().includes(keyword) ||
        row.serviceName.toLowerCase().includes(keyword) ||
        (row.matchedPartyName ?? '').toLowerCase().includes(keyword);

      const matchesStatus = status === '전체' || row.status === status;
      const matchesService =
        serviceName === '전체' || row.serviceName === serviceName;

      return matchesKeyword && matchesStatus && matchesService;
    });
  }, [search, status, serviceName]);

  const selected = useMemo(
    () =>
      filtered.find((row) => row.requestId === selectedRequestId) ??
      filtered[0] ??
      null,
    [filtered, selectedRequestId],
  );

  const handleSavePolicy = () => {
    if (!isWeightValid) {
      alert('AI score 가중치 합계는 1.0이어야 합니다.');
      return;
    }

    // TODO: 실제 API 호출
    console.log('저장', {
      ruleWeight,
      vectorWeight,
      llmWeight,
      llmTopN,
      maxRetry,
    });
  };

  return (
    <>
      <AdminHeader
        placeholder="요청 ID / 유저 / 서비스 / 파티 검색"
        onSearch={setSearch}
        rightContent={
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              임베딩 백필 실행
            </button>
            <button className="rounded-md border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">
              지표 새로고침
            </button>
          </div>
        }
      />

      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">빠른매칭 관리</h1>
          <p className="mt-1 text-sm text-slate-500">
            빠른매칭 요청 현황, 운영 제어, 실패 원인, 후보 점수 상세, 임베딩
            상태를 한 화면에서 관리합니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="오늘 요청 수"
            value={SUMMARY.totalRequestsToday.toLocaleString()}
            description="당일 생성된 빠른매칭 요청 수"
            tone="border-slate-200 bg-white text-slate-900"
          />
          <SummaryCard
            title="성공률"
            value={`${SUMMARY.successRate.toFixed(1)}%`}
            description={`${SUMMARY.successCount}건 성공 · ${SUMMARY.failCount}건 실패`}
            tone="border-emerald-200 bg-emerald-50 text-emerald-700"
          />
          <SummaryCard
            title="평균 매칭 시간"
            value={`${SUMMARY.avgMatchSeconds.toFixed(1)}초`}
            description="요청 생성부터 실제 매칭 완료까지 평균"
            tone="border-blue-200 bg-blue-50 text-blue-700"
          />
          <SummaryCard
            title="운영 주의"
            value={`${SUMMARY.missingPartyEmbeddingCount}건`}
            description={`재매칭 ${SUMMARY.rematchCount}건 · 파티 임베딩 누락`}
            tone="border-amber-200 bg-amber-50 text-amber-700"
          />
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">운영 제어</h2>
            <p className="mt-1 text-xs text-slate-500">
              전체 스위치, LLM 사용 여부, fallback 정책, 재매칭 정책을
              관리자에서 제어합니다.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ToggleCard
              title="빠른매칭 전체 사용"
              description="장애 또는 운영 이슈 시 빠른매칭 전체를 즉시 중단하는 kill switch"
              enabled={quickMatchEnabled}
              onToggle={() => setQuickMatchEnabled((prev) => !prev)}
            />
            <ToggleCard
              title="LLM 판단 사용"
              description="상위 후보 LLM 판단 사용 여부. 끄면 rule + vector 기반으로만 운영"
              enabled={llmEnabled}
              onToggle={() => setLlmEnabled((prev) => !prev)}
            />
            <ToggleCard
              title="Fallback only 모드"
              description="긴급 시 LLM을 완전히 우회하고 fallback 점수만 사용"
              enabled={fallbackOnlyEnabled}
              onToggle={() => setFallbackOnlyEnabled((prev) => !prev)}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">
                정책 튜닝
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <div className="mb-2 text-xs font-medium text-slate-500">
                    LLM 적용 후보 수
                  </div>
                  <select
                    value={llmTopN}
                    onChange={(e) => setLlmTopN(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
                  >
                    {[1, 3, 5, 10].map((n) => (
                      <option key={n} value={n}>
                        상위 {n}개
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="mb-2 text-xs font-medium text-slate-500">
                    최대 재시도 횟수
                  </div>
                  <select
                    value={maxRetry}
                    onChange={(e) => setMaxRetry(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}회
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handleSavePolicy}
                  className="rounded-md border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                >
                  정책 저장
                </button>
                <button className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                  기본값 복원
                </button>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                AI Score 가중치 설정
              </div>
              <p className="mt-1 text-xs text-slate-500">
                합계는 1.0이어야 합니다. 현재 식:
                <span className="ml-1 font-mono text-slate-700">
                  AI = rule * {ruleWeight.toFixed(2)} + vector *{' '}
                  {vectorWeight.toFixed(2)} + llm * {llmWeight.toFixed(2)}
                </span>
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <div className="mb-2 text-xs font-medium text-slate-500">
                    Rule weight
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={ruleWeight}
                    onChange={(e) => setRuleWeight(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 text-xs font-medium text-slate-500">
                    Vector weight
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={vectorWeight}
                    onChange={(e) => setVectorWeight(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 text-xs font-medium text-slate-500">
                    LLM weight
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={llmWeight}
                    onChange={(e) => setLlmWeight(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
                  />
                </label>
              </div>

              <div
                className="mt-3 flex items-center justify-between rounded-lg border px-3 py-2 text-sm
    ${isWeightValid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}"
              >
                <span>가중치 합계</span>
                <span className="font-semibold">{weightSum.toFixed(2)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">
                운영 액션
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                  전체 파티 임베딩 백필
                </button>
                <button className="rounded-md border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition">
                  임베딩 누락 파티 조회
                </button>
                <button className="rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition">
                  실패 요청 재처리
                </button>
                <button className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition">
                  긴급 중지
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                현재 설정: 빠른매칭 {quickMatchEnabled ? 'ON' : 'OFF'} · LLM{' '}
                {llmEnabled ? 'ON' : 'OFF'} · fallback only{' '}
                {fallbackOnlyEnabled ? 'ON' : 'OFF'} · LLM 상위 {llmTopN}개 ·
                최대 재시도 {maxRetry}회
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as '전체' | QuickMatchStatus)
                  }
                >
                  <option value="전체">전체 상태</option>
                  <option value="REQUESTED">REQUESTED</option>
                  <option value="MATCHED">MATCHED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="REMATCHING">REMATCHING</option>
                </select>

                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                >
                  {services.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <div className="ml-auto text-xs text-slate-400">
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
                        className="px-4 py-3.5 text-left text-sm font-semibold text-slate-500"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const isSelected = selected?.requestId === row.requestId;

                    return (
                      <tr
                        key={row.requestId}
                        className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${
                          isSelected ? 'bg-indigo-50/50' : ''
                        }`}
                        onClick={() => setSelectedRequestId(row.requestId)}
                      >
                        <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                          {row.requestedAt}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium text-slate-800">
                          {row.requestId}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-700">
                          <div>{row.userNickname}</div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            {row.userId}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-700">
                          {row.serviceName}
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              STATUS_STYLE[row.status]
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-700">
                          {row.matchedPartyName ?? '-'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-700">
                          {formatSeconds(row.totalMatchSeconds)}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-700">
                          {row.retryCount}회
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm text-slate-400"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {!selected ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400">
                상세를 볼 요청을 선택해주세요.
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Request Detail
                    </div>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {selected.requestId}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selected.userNickname} · {selected.serviceName}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                      STATUS_STYLE[selected.status]
                    }`}
                  >
                    {selected.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ['선택 파티', selected.matchedPartyName ?? '-'],
                    ['실패 사유', selected.failReason ?? '-'],
                    ['총 소요 시간', formatSeconds(selected.totalMatchSeconds)],
                    ['재시도 횟수', `${selected.retryCount}회`],
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
                    사용자 프로필 스냅샷
                  </h3>
                  <div className="mt-3 grid gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs font-medium text-slate-400">
                        선호 조건
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        {
                          selected.aiProfileSnapshot.preferredConditions
                            .category
                        }{' '}
                        /{' '}
                        {
                          selected.aiProfileSnapshot.preferredConditions
                            .platform
                        }{' '}
                        /{' '}
                        {
                          selected.aiProfileSnapshot.preferredConditions
                            .priceRange
                        }{' '}
                        /{' '}
                        {
                          selected.aiProfileSnapshot.preferredConditions
                            .durationPreference
                        }
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
                          {selected.aiProfileSnapshot.riskSummary.reportCount}회
                          · 이탈{' '}
                          {selected.aiProfileSnapshot.riskSummary.leaveCount}회
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      후보 점수 상세
                    </h3>
                    <div className="text-xs text-slate-400">
                      rule / vector / llm / final
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selected.candidates.map((candidate) => (
                      <div
                        key={candidate.candidateId}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              #{candidate.rank} {candidate.partyName}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {candidate.partyId}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                CANDIDATE_STATUS_STYLE[candidate.status]
                              }`}
                            >
                              {candidate.status}
                            </span>
                            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                              AI {candidate.aiScore.toFixed(3)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-4">
                          {[
                            ['Rule', candidate.ruleScore.toFixed(3)],
                            ['Vector', candidate.vectorScore.toFixed(3)],
                            ['LLM', candidate.llmScore.toFixed(3)],
                            ['Final', candidate.aiScore.toFixed(3)],
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
                            판단 근거
                          </div>
                          <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
                            {JSON.stringify(candidate.filterReasons, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="mb-3 text-sm font-semibold text-slate-900">
                    요청 단위 제어
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition">
                      수동 재매칭
                    </button>
                    <button className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition">
                      요청 강제 실패
                    </button>
                    <button className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                      재매칭 중단
                    </button>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-5">
                  <div className="mb-3 text-sm font-semibold text-slate-900">
                    사용자 / 파티 제어
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                      사용자 임베딩 재생성
                    </button>
                    <button className="rounded-md border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition">
                      파티 임베딩 재생성
                    </button>
                    <button className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                      사용자 매칭 차단
                    </button>
                    <button className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                      파티 매칭 제외
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              빠른매칭 운영 포인트
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              실패 사유, 임베딩 누락, 상위 5개 LLM 적용 여부를 중심으로
              운영합니다.
            </p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                실패 사유 TOP
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• NO_CANDIDATE</li>
                <li>• PARTY_FULL</li>
                <li>• party_embedding_not_found</li>
                <li>• trust_score_too_low</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                임베딩 운영
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• 파티 생성/수정 시 임베딩 재생성</li>
                <li>• 사용자 변경 이벤트 시 프로필/임베딩 갱신</li>
                <li>• 누락 파티 백필 실행</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                성능 점검
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• create_request 평균 시간</li>
                <li>• find_candidates 평균 시간</li>
                <li>• 상위 5개 LLM 적용 비율</li>
                <li>• fallback 점수 사용 비율</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
